import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars manually to avoid dotenv dependency assumption
const envPath = path.resolve(__dirname, '../.env');
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envConfig[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUser(email: string) {
    console.log(`\n--- Verifying data for ${email} ---`);

    // Get Member ID
    const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, role, schedule')
        .eq('email', email/* We might need to join or match differently if email is not on members directly? 
           Update: 'members' table usually has email or is linked to auth.users. 
           Let's check if 'members' has an email column. Based on previous context, likely yes or linked via auth.users.
           Wait, usually 'members' is keyed by 'user_id' or has 'email'. 
           I'll assume 'email' exists on 'members' for now based on context, or I'll first fetch the user ID. 
           Actually, commonly strict RLs might block listing members. 
           But I have the anon key. 
           If this fails, I'll try to sign in via password? No, I can't do that easily in script without password.
           Let's assume I can read 'members' if I query closely? 
           Actually, the best way verification might be to use the 'service_role' key if available in .env? 
           Let's check for SUPABASE_SERVICE_ROLE_KEY.
        */);
    // Note: If RLS is on, Anon key might not see other users.
    // I might strictly need to use the browser to verify the "output" via the UI, 
    // BUT the user asked for "SQL outputs".

    if (memberError || !members || members.length === 0) {
        // Fallback: try to find by auth.users? safely invalid since we can't access auth.users table easily with anon key.
        console.log('Error fetching member or not found (RLS might be blocking):', memberError);
        return;
    }

    const member = members[0];
    console.log(`Member Role: ${member.role}`);
    console.log('members.schedule:', JSON.stringify(member.schedule, null, 2));

    if (member.role === 'caregiver') {
        const { data: profiles, error: profileError } = await supabase
            .from('caregiver_profiles')
            .select('availability_days, availability_blocks, hourly_rate')
            .eq('member_id', member.id);

        if (profileError) {
            console.log('Error fetching caregiver profile:', profileError);
        } else if (profiles && profiles.length > 0) {
            console.log('caregiver_profiles.availability_days:', JSON.stringify(profiles[0].availability_days, null, 2));
            console.log('caregiver_profiles.availability_blocks:', JSON.stringify(profiles[0].availability_blocks, null, 2));
            console.log('caregiver_profiles.hourly_rate:', profiles[0].hourly_rate);
        } else {
            console.log('No caregiver profile found.');
        }
    }
}

const email = process.argv[2];
if (!email) {
    console.log("Please provide an email argument.");
} else {
    verifyUser(email).catch(console.error);
}
