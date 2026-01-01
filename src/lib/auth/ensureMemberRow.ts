import { supabase } from '../supabase';

/**
 * Idempotent function to ensure a row exists in the 'members' table for the current authenticated user.
 * Runs minimal insertion only if the row is missing.
 * Canonical Roles: 'family' | 'caregiver'
 */
export async function ensureMemberRow() {
    try {
        // 1. Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('ensureMemberRow: No authenticated user found.');
            return { success: false, error: authError || new Error('No user') };
        }

        const userId = user.id;
        const email = user.email;
        const metadata = user.user_metadata || {};

        // 2. Check if member exists
        const { data: existing, error: fetchError } = await supabase
            .from('members')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (fetchError) {
            console.error('ensureMemberRow: Error checking existence:', fetchError);
            throw fetchError;
        }

        // 3. If exists, do nothing
        if (existing) {
            return { success: true, created: false };
        }

        // 4. Determine Defaults (Canonical Only)
        // strict logic: family | caregiver
        const rawIntent = metadata.intent;
        let role = 'family'; // Default

        // Strict mapping: only 'caregiver' maps to 'caregiver'
        if (rawIntent === 'caregiver') {
            role = 'caregiver';
        }

        // Name Logic: Prefer broken out fields, fallback to splitting full_name
        let firstName = metadata.first_name || '';
        let lastName = metadata.last_name || '';

        if (!firstName && metadata.full_name) {
            const parts = metadata.full_name.trim().split(' ');
            firstName = parts[0];
            if (parts.length > 1) {
                lastName = parts.slice(1).join(' ');
            }
        }

        // Zip Code Default
        const zipCode = metadata.zip_code || '00000';

        const payload = {
            id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: role,
            onboarding_complete: false,
            zip_code: zipCode,
            // Init arrays/jsonb handled by DB defaults if omitted, but explicit here for clarity
            care_types: [],
            languages: []
        };

        console.log('ensureMemberRow: Creating new member row', payload);

        // 5. Insert
        const { error: insertError } = await supabase
            .from('members')
            .insert(payload);

        if (insertError) {
            console.error('ensureMemberRow: Error inserting row:', insertError);
            throw insertError;
        }

        return { success: true, created: true };

    } catch (error) {
        console.error('ensureMemberRow: Unexpected error:', error);
        return { success: false, error };
    }
}
