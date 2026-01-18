const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env');
const envConfig = {};

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
// Try service role first, then anon
let supabaseKey = envConfig['VITE_SUPABASE_SERVICE_ROLE_KEY'] || envConfig['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseKey) {
    console.log("Service role key not found, using ANON key. (RLS might block results)");
    supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUser(email) {
    console.log(`\n--- Verifying data for ${email} ---`);

    // Get Member ID. Note: This assumes we can query members table.
    const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, role, schedule, user_id')
        .eq('email', email);

    if (memberError || !members || members.length === 0) {
        console.log('Error fetching member (or not found due to RLS):', memberError);
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
