import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/"/g, '');
        env[key] = value;
    }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
// Try all likely keys for service role
const SUPABASE_SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing credentials in .env');
    process.exit(1);
}

// 2. Init Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateLink(email) {
    console.log(`Generating magic link for ${email}...`);
    // 3. Generate Link
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            redirectTo: 'http://localhost:5173/dashboard'
        }
    });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('MAGIC_LINK:', data.properties.action_link);
    }
}

const email = process.argv[2];
if (!email) {
    console.log("Usage: node scripts/generate_login.js <email>");
    process.exit(1);
}

generateLink(email);
