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

        // 2. Check if row exists first (Idempotency)
        const { data: existingMember } = await supabase
            .from('members')
            .select('email, role')
            .eq('id', userId)
            .maybeSingle();

        if (existingMember) {
            // Row exists. Check if we need to backfill email.
            if (!existingMember.email && email) {
                console.log('ensureMemberRow: Backfilling missing email');
                await supabase.from('members').update({ email }).eq('id', userId);
            }
            // Otherwise, we are good. Do NOT update simple timestamp.
            return { success: true, role: existingMember.role };
        }

        // 3. If we get here, row is missing. Proceed with default creation logic.

        // Determine Defaults (Canonical Only)

        // Check if caregiver profile exists (Source of Truth for Role)
        const { data: caregiverProfile } = await supabase
            .from('caregiver_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        const hasCaregiverProfile = !!caregiverProfile;

        // Role Logic
        const rawIntent = metadata.intent;
        let role = 'family'; // Default
        if (hasCaregiverProfile) {
            role = 'caregiver';
        } else if (rawIntent === 'caregiver' || rawIntent === 'providing') {
            role = 'caregiver';
        }

        // Name Logic
        let firstName = metadata.first_name || '';
        let lastName = metadata.last_name || '';

        if (!firstName && metadata.full_name) {
            const parts = metadata.full_name.trim().split(' ');
            firstName = parts[0];
            if (parts.length > 1) {
                lastName = parts.slice(1).join(' ');
            }
        }

        // Zip Code: Strict - No defaults like '00000'
        const zipCode = metadata.zip_code || null;

        const payload = {
            id: userId,
            email: email,
            first_name: firstName || 'New',
            last_name: lastName || 'Member',
            role: role,
            onboarding_complete: false,
            zip_code: zipCode
            // REMOVED: updated_at to avoid feedback loops
        };

        console.log('ensureMemberRow: INSERTING new member row', { id: userId, role });

        // 4. Insert (using Upsert to be safe against race conditions)
        const { error: upsertError } = await supabase
            .from('members')
            .upsert(payload, { onConflict: 'id' });

        if (upsertError) {
            console.error('ensureMemberRow: Error inserting row:', upsertError);
            // Fallback check using maybeSingle instead of single
            const { error: fetchError } = await supabase.from('members').select('id').eq('id', userId).maybeSingle();
            if (fetchError) throw upsertError;
        }

        return { success: true, role };

    } catch (error) {
        console.error('ensureMemberRow: Unexpected error:', error);
        return { success: false, error };
    }
}
