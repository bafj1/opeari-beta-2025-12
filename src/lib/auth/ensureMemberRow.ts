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

        if (authError || !user || !user.email) {
            console.error('ensureMemberRow: No authenticated user or EMAIL found.');
            return { success: false, error: authError || new Error('No user or email') };
        }

        const userId = user.id;
        const email = user.email;
        const metadata = user.user_metadata || {};

        // 2. Check if caregiver profile exists (Source of Truth for Role)
        const { data: caregiverProfile } = await supabase
            .from('caregiver_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        const hasCaregiverProfile = !!caregiverProfile;
        console.log(`ensureMemberRow: Caregiver profile check: ${hasCaregiverProfile ? 'FOUND' : 'NOT FOUND'}`);

        // 3. Determine Defaults (Canonical Only)
        // If caregiver profile exists, FORCIBLY set role to caregiver
        const rawIntent = metadata.intent;
        let role = 'family'; // Default

        if (hasCaregiverProfile) {
            role = 'caregiver';
        } else if (rawIntent === 'caregiver' || rawIntent === 'providing') {
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
            updated_at: new Date().toISOString()
        };

        console.log('ensureMemberRow: UPSERTING member row', { id: userId, role });

        // 4. Upsert (Idempotent)
        const { error: upsertError } = await supabase
            .from('members')
            .upsert(payload, { onConflict: 'id', ignoreDuplicates: false });

        if (upsertError) {
            console.error('ensureMemberRow: Error upserting row:', upsertError);
            // If error is duplicate key (shouldn't happen with upsert but RLS might block), fallback to checking existence
            const { error: fetchError } = await supabase.from('members').select('id').eq('id', userId).single();
            if (fetchError) {
                throw upsertError; // Real error
            }
            // If row exists, we are good, just couldn't update it due to RLS policies perhaps
            console.warn('ensureMemberRow: Upsert failed but row exists (likely RLS). Continuing.');
        }

        return { success: true, role };

    } catch (error) {
        console.error('ensureMemberRow: Unexpected error:', error);
        return { success: false, error };
    }
}
