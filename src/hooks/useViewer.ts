import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ensureMemberRow } from '../lib/auth/ensureMemberRow';
import { useAuth } from '../context/AuthContext';

export interface Viewer {
    member: any; // Using any for now to avoid rigid type dep, in real app likely Member interface
    caregiverProfile?: any;
    user?: any; // Supabase Auth User
}

export function useViewer() {
    const { user } = useAuth();
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch canonical rows (Member + Optional Caregiver Profile)
    const refresh = useCallback(async () => {
        // Always get the latest auth user to ensure we have the email
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            console.error('useViewer: Auth error or no user', authError);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Fetch Member
            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (memberError) {
                // If member doesn't exist, this is critical
                throw new Error(`Failed to load member profile: ${memberError.message}`);
            }

            // BACKFILL EMAIL IF MISSING (Non-destructive sync)
            if (!member.email && currentUser.email) {
                const { error: updateError } = await supabase
                    .from('members')
                    .update({ email: currentUser.email })
                    .eq('id', currentUser.id);

                if (!updateError) {
                    member.email = currentUser.email; // Optimistic update
                }
            }

            let caregiverProfile = null;

            // 2. If role is caregiver, fetch caregiver profile
            if (member.role === 'caregiver') {
                const { data: profile, error: profileError } = await supabase
                    .from('caregiver_profiles')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (profile) {
                    caregiverProfile = profile;
                } else {
                    // Lazy creation if missing for caregiver role
                    console.log('useViewer: Caregiver role but no profile. Creating stub.');
                    const { data: newProfile, error: createError } = await supabase
                        .from('caregiver_profiles')
                        .insert({
                            user_id: currentUser.id,
                            first_name: member.first_name,
                            last_name: member.last_name,
                            email: currentUser.email, // Use Auth Email for robustness
                            zip_code: member.zip_code
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    caregiverProfile = newProfile;
                }
            }

            // Attach the Auth User object to the viewer for specialized access if needed
            setViewer({ member, caregiverProfile, user: currentUser });

        } catch (err: any) {
            console.error('useViewer: Error fetching viewer:', err);
            setError(err);
            setViewer(null);
        } finally {
            setLoading(false);
        }
    }, []); // Removed 'user' dependency to avoid loops, rely on explicit getUser calls

    // Initial Mount Effect: Ensure Row -> Then Refresh
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Run ensureMemberRow ONCE on mount
                await ensureMemberRow();

                // Then fetch data
                if (mounted) {
                    await refresh();
                }
            } catch (err: any) {
                if (mounted) {
                    console.error('useViewer: Init error', err);
                    setError(err);
                    setLoading(false);
                }
            }
        };

        init();

        return () => { mounted = false; };
    }, [user, refresh]); // Rely on stable user/refresh identity

    return { viewer, loading, error, refresh };
}
