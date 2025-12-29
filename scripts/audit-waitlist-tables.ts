
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('Auditing Waitlist Tables...');

    // 1. Load Env
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });

    const url = env['VITE_SUPABASE_URL'];
    const key = env['VITE_SUPABASE_ANON_KEY'];

    if (!url || !key) {
        console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
        process.exit(1);
    }

    console.log('Connecting to Supabase...');
    const supabase = createClient(url, key);

    // 2. Check "waitlist" table (Legacy?)
    console.log('\n--- Checking Table: "waitlist" ---');
    const { count: count1, error: error1 } = await supabase.from('waitlist').select('*', { count: 'exact', head: true });
    if (error1) {
        console.log('Error accessing "waitlist":', error1.message);
    } else {
        console.log(`Row Count: ${count1}`);
        // Get columns by fetching 1 row
        const { data: data1 } = await supabase.from('waitlist').select('*').limit(1);
        if (data1 && data1.length > 0) {
            console.log('Columns detected:', Object.keys(data1[0]).join(', '));
        } else {
            console.log('No rows to infer columns from.');
        }
    }

    // 3. Check "waitlist_entries" table (Active?)
    console.log('\n--- Checking Table: "waitlist_entries" ---');
    const { count: count2, error: error2 } = await supabase.from('waitlist_entries').select('*', { count: 'exact', head: true });
    if (error2) {
        console.log('Error accessing "waitlist_entries":', error2.message);
    } else {
        console.log(`Row Count: ${count2}`);
        // Get columns
        const { data: data2 } = await supabase.from('waitlist_entries').select('*').limit(1);
        if (data2 && data2.length > 0) {
            console.log('Columns detected:', Object.keys(data2[0]).join(', '));
        } else {
            console.log('No rows to infer columns from.');
        }
    }

    // 4. Check "auth.users" (Just to see if we can?) - usually blocked for anon
    // console.log('\n--- Checking Auth Users (Admin only usually) ---');

}

main().catch(console.error);
