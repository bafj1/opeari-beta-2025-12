import { createClient } from '@supabase/supabase-js';
import { determineVettingRequirements } from '../src/lib/vetting';

// Note: You need a Service Role Key to bypass RLS and delete test users cleanly.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Please provide VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mock Data Templates
const mockSeekerData = {
    careOptions: ['nanny-share', 'backup-care'],
    userIntent: 'seeking',
} as any;

const mockHostData = {
    careOptions: ['nanny-share', 'host-share'],
    userIntent: 'seeking',
} as any;

async function testVettingFlow() {
    console.log('=== Testing Onboarding + Vetting Flow (Logic & DB) ===\n');

    // --- UNIT TEST ---
    console.log('TEST 1: Vetting Logic Unit Test');
    const seekerResult = determineVettingRequirements(mockSeekerData, false);
    console.log('Seeker Result:', seekerResult);
    if (seekerResult.vetting_required === false) console.log('✅ Seeker Logic PASS');
    else console.log('❌ Seeker Logic FAIL');

    const hostResult = determineVettingRequirements(mockHostData, true); // hostInterest=true
    console.log('Host Result:', hostResult);
    if (hostResult.vetting_required === true && hostResult.vetting_types.includes('host')) console.log('✅ Host Logic PASS');
    else console.log('❌ Host Logic FAIL');


    // --- DB TEST (Requires running DB) ---
    console.log('\nTEST 2: Database Writes (Simulation)');
    // We will create a temp user, save their profile, and check the flags.

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    try {
        // 1. Create User
        console.log(`Creating test user: ${testEmail}...`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true
        });

        if (authError) throw authError;
        const userId = authData.user.id;
        console.log('User created:', userId);

        // 2. Insert Member Profile (Seeker)
        console.log('Inserting SEELER profile...');
        const { error: insertError } = await supabase.from('members').insert({
            id: userId,
            first_name: 'Test',
            last_name: 'Seeker',
            zip_code: '90210',
            care_types: mockSeekerData.careOptions,
            vetting_required: seekerResult.vetting_required,
            vetting_status: seekerResult.vetting_required ? 'required' : 'not_required',
            vetting_types: seekerResult.vetting_types
        });
        if (insertError) throw insertError;
        console.log('Profile inserted.');

        // 3. Verify
        const { data: verifyData } = await supabase.from('members').select('vetting_required').eq('id', userId).single();
        if (verifyData?.vetting_required === false) {
            console.log('✅ DB Seeker Verify PASS');
        } else {
            console.log('❌ DB Seeker Verify FAIL:', verifyData);
        }

        // 4. Update to Host
        console.log('Updating to HOST profile...');
        await supabase.from('members').update({
            care_types: mockHostData.careOptions,
            vetting_required: hostResult.vetting_required,
            vetting_status: 'required',
            vetting_types: hostResult.vetting_types
        }).eq('id', userId);

        const { data: verifyHost } = await supabase.from('members').select('vetting_required, vetting_types').eq('id', userId).single();
        if (verifyHost?.vetting_required === true) {
            console.log('✅ DB Host Verify PASS');
        } else {
            console.log('❌ DB Host Verify FAIL:', verifyHost);
        }

        // 5. Cleanup
        console.log('Cleaning up...');
        await supabase.auth.admin.deleteUser(userId);
        // Profile cascade delete should handle member row, or delete manually if not cascaded
        await supabase.from('members').delete().eq('id', userId);
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Test Failed:', err);
    }

    console.log('\n=== All Tests Complete ===');
}

testVettingFlow();
