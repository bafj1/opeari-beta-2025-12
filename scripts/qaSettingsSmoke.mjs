
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- Configuration & Setup ---

const envPath = path.resolve(process.cwd(), '.env');
let env = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) {
    console.warn('Could not read .env file, relying on process.env');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Admin client for Setup (Bypasses RLS)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// User client for Tests (Enforces RLS)
const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// --- Test Data ---

const FAMILY_USER = {
    email: 'qa_family_002@opeari.com',
    password: 'password123',
    role: 'family'
};

const CAREGIVER_USER = {
    email: 'qa_caregiver_002@opeari.com',
    password: 'password123',
    role: 'caregiver'
};

// --- Helpers ---

async function setupUserAndData(userData) {
    console.log(`[Setup] Ensuring user ${userData.email} exists and is confirmed...`);

    let userId;

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { first_name: 'Test', role: userData.role }
    });

    if (createError) {
        if (createError.message.includes('already registered') || createError.message.includes('unique constraint')) {
            console.log(`[Setup] User ${userData.email} exists. Fetching ID...`);
            // We need the ID. We can use listUsers with filter.
            const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
            if (listError) throw listError;
            const found = listData.users.find(u => u.email === userData.email);
            if (!found) throw new Error(`User ${userData.email} registered but not found in list`);
            userId = found.id;

            // Update to ensure validity
            await adminClient.auth.admin.updateUserById(userId, { password: userData.password, email_confirm: true });
        } else {
            throw createError;
        }
    } else {
        userId = createData.user.id;
        console.log(`[Setup] Created user ${userId}`);
    }

    // 2. Upsert Members Row (Bypass RLS)
    console.log(`[Setup] Upserting members row for ${userId}...`);
    const { error: memberError } = await adminClient
        .from('members')
        .upsert({
            id: userId,
            role: userData.role,
            first_name: 'Test',
            bio: 'Initial Setup Bio',
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (memberError) throw new Error(`Failed to upsert member: ${memberError.message}`);

    // 3. Upsert Caregiver Profile (if caregiver)
    if (userData.role === 'caregiver') {
        console.log(`[Setup] Upserting caregiver_profiles for ${userId}...`);

        const { error: cgError } = await adminClient
            .from('caregiver_profiles')
            .upsert({
                user_id: userId,
                hourly_rate: 15,
                years_experience: 1
            }, { onConflict: 'user_id' });

        if (cgError) throw cgError;
    }

    return userId;
}

async function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        throw new Error(message);
    }
    console.log(`PASS: ${message}`);
}


// --- Main Test Flow ---

async function runTests() {
    console.log('Starting Data-Integrity Smoke Test (Service Role Setup)...');

    try {
        // --- SETUP ---
        console.log('\n--- Setup Phase ---');
        const familyId = await setupUserAndData(FAMILY_USER);
        console.log(`Family User Clean: ${familyId}`);

        const caregiverId = await setupUserAndData(CAREGIVER_USER);
        console.log(`Caregiver User Clean: ${caregiverId}`);

        // --- TEST (ANON CLIENT) ---
        console.log('\n--- Execution Phase (Anon Client) ---');

        // 1. Family Flow
        console.log('Logging in as Family...');
        const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
            email: FAMILY_USER.email,
            password: FAMILY_USER.password
        });
        if (authError) throw new Error(`Auth failed: ${authError.message}`);
        const fUser = authData.user;

        // A) Update Profile
        console.log('Updating Family Profile...');
        const newProfile = { first_name: `Fam${Date.now()}`, bio: `Bio updated ${Date.now()}` };
        const { error: pError } = await userClient
            .from('members')
            .update(newProfile)
            .eq('id', fUser.id);
        if (pError) throw pError;

        // Check
        let { data: member } = await userClient.from('members').select('*').eq('id', fUser.id).single();
        await assert(member.first_name === newProfile.first_name, 'Profile updated');

        // Store initial 'other' fields
        const initialCare = JSON.stringify(member.availability_days || []);
        const initialVillage = JSON.stringify(member.support_notes || '');

        // B) Update Care (check isolation)
        console.log('Updating Family Care Fields...');
        const newCare = { availability_days: ['mon', 'wed'] };
        const { error: cError } = await userClient.from('members').update(newCare).eq('id', fUser.id);
        if (cError) throw cError;

        member = (await userClient.from('members').select('*').eq('id', fUser.id).single()).data;
        await assert(JSON.stringify(member.availability_days) === JSON.stringify(newCare.availability_days), 'Care updated');

        // Isolation Check
        await assert(member.first_name === newProfile.first_name, 'Profile fields NOT overwritten by Care update');
        await assert(member.bio === newProfile.bio, 'Profile bio NOT overwritten by Care update'); // Extra Assertion
        await assert(JSON.stringify(member.support_notes || '') === initialVillage, 'Village fields NOT overwritten by Care update');


        // C) Update Village (check isolation)
        console.log('Updating Family Village Fields...');
        const newVillage = { support_notes: 'Needs help with pickup' };
        const { error: vError } = await userClient.from('members').update(newVillage).eq('id', fUser.id);
        if (vError) throw vError;

        member = (await userClient.from('members').select('*').eq('id', fUser.id).single()).data;
        await assert(member.support_notes === newVillage.support_notes, 'Village updated');
        await assert(JSON.stringify(member.availability_days) === JSON.stringify(newCare.availability_days), 'Care fields NOT overwritten by Village update');
        await assert(member.first_name === newProfile.first_name, 'Profile fields NOT overwritten by Village update');


        // 2. Caregiver Flow
        // No need to signOut explicitly if we just stop using the token, but good practice.
        await userClient.auth.signOut();

        console.log('\nLogging in as Caregiver...');
        const { data: cgAuth, error: cgAuthError } = await userClient.auth.signInWithPassword({
            email: CAREGIVER_USER.email,
            password: CAREGIVER_USER.password
        });
        if (cgAuthError) throw cgAuthError;
        const cUser = cgAuth.user;

        // A) Update Caregiver Profile
        console.log('Updating Caregiver Profile...');

        const newCgStats = { years_experience: 7, hourly_rate: 30 };

        // Strict schema usage: user_id
        const { error: cgUpdateError } = await userClient
            .from('caregiver_profiles')
            .update(newCgStats)
            .eq('user_id', cUser.id);

        if (cgUpdateError) throw cgUpdateError;

        // Verify
        const { data: cgProfile, error: cgFetchError } = await userClient
            .from('caregiver_profiles')
            .select('*')
            .eq('user_id', cUser.id)
            .single();

        if (cgFetchError) throw cgFetchError;

        await assert(cgProfile.years_experience === 7, 'Caregiver exp updated');

        // B) Verify Member Role Integrity
        const { data: cgMember } = await userClient.from('members').select('role').eq('id', cUser.id).single();
        await assert(cgMember.role === 'caregiver', 'Member role persisted as caregiver');


        console.log('\n-----------------------------------');
        console.log('✅ ALL TESTS PASSED');
        console.log('-----------------------------------');
        process.exit(0);

    } catch (err) {
        console.error('\n-----------------------------------');
        console.error('❌ TEST FAILED');
        console.error(err);
        console.error('-----------------------------------');
        process.exit(1);
    }
}

runTests();
