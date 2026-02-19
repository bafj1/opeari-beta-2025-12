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
        // Task 2.A: Do NOT call getUser(). Use user from useAuth().
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Fetch Member - Task 2.B: Use maybeSingle()
            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (memberError) {
                throw new Error(`Failed to load member profile: ${memberError.message}`);
            }

            let loadedMember = member;

            // Task 2.C: If member is null, ensure then retry once
            if (!loadedMember) {
                console.warn('useViewer: Member not found, re-ensuring...');
                await ensureMemberRow();

                const { data: retryData, error: retryError } = await supabase
                    .from('members')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (retryError) throw new Error(`Failed to load member profile (retry): ${retryError.message}`);

                if (!retryData) {
                    // Task 2.C: If still null, stop loading and error (no infinite spinner)
                    throw new Error('Failed to load member profile: no member row found after ensureMemberRow retry.');
                }

                loadedMember = retryData;
            }

            // BACKFILL EMAIL IF MISSING (Non-destructive sync)
            if (!loadedMember.email && user.email) {
                const { error: updateError } = await supabase
                    .from('members')
                    .update({ email: user.email })
                    .eq('id', user.id);

                if (!updateError) {
                    loadedMember.email = user.email; // Optimistic update
                }
            }

            let caregiverProfile = null;

            // 2. If role is caregiver, fetch caregiver profile - Task 2.D: ONLY if member loaded and role is caregiver
            if (loadedMember && loadedMember.role === 'caregiver') {
                const { data: profile, error: profileError } = await supabase
                    .from('caregiver_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (profile) {
                    caregiverProfile = profile;
                } else {
                    // Lazy creation if missing for caregiver role
                    console.log('useViewer: Caregiver role but no profile. Creating stub.');

                    // Optimistic insert with .single()
                    const { data: newProfile, error: createError } = await supabase
                        .from('caregiver_profiles')
                        .insert({
                            user_id: user.id,
                            first_name: loadedMember.first_name,
                            last_name: loadedMember.last_name,
                            email: user.email,
                            zip_code: loadedMember.zip_code
                        })
                        .select('*')
                        .single();

                    if (!createError && newProfile) {
                        caregiverProfile = newProfile;
                    } else {
                        // Conflict or error? Re-fetch safely.
                        // This handles the race where it was created in another tab/process
                        console.warn('useViewer: Insert failed or conflicted, refetching...', createError?.message);

                        const { data: retryProfile, error: retryError } = await supabase
                            .from('caregiver_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (retryError) throw retryError;
                        if (!retryProfile) {
                            throw new Error('Caregiver profile could not be created or loaded.');
                        }
                        caregiverProfile = retryProfile;
                    }
                }
            }

            // Attach the Auth User object to the viewer for specialized access if needed
            setViewer({ member: loadedMember, caregiverProfile, user });

        } catch (err: any) {
            console.error('useViewer: Error fetching viewer:', err);
            setError(err);
            setViewer(null);
        } finally {
            setLoading(false);
        }
    }, [user]); // Rely on stable user identity

    // Initial Mount Effect
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            // Task 2.F: Ensure useEffect does not create loops.
            // Just call refresh() which has the ensure logic inside.
            if (mounted) {
                await refresh();
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, [user, refresh]);

    return { viewer, loading, error, refresh };
}
