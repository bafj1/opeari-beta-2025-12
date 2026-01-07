import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { INITIAL_DATA } from './OnboardingTypes';
import type { OnboardingData } from './OnboardingTypes';
import { determineVettingRequirements } from '../../lib/vetting';
import { ensureMemberRow } from '../../lib/auth/ensureMemberRow';

export function useOnboarding() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive step from URL (Source of Truth) to support Browser Back Button
    const step = parseInt(searchParams.get('step') || '0');

    const setStep = (newStep: number | ((prev: number) => number)) => {
        const nextValue = typeof newStep === 'function' ? newStep(step) : newStep;
        setSearchParams({ step: nextValue.toString() });
        window.scrollTo(0, 0);
    };
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);

    const [passwordConfirm, setPasswordConfirm] = useState('');

    // UI Local state that doesn't need to be in main data object but affects UI
    // hostingInterest moved to OnboardingData
    const [showSomethingElseInput, setShowSomethingElseInput] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [hasRestored, setHasRestored] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    setLoading(false)
                    return
                }

                const user = session.user
                setUserId(user.id)

                // --- PHASE 2: RESTORE LOCAL STORAGE ---
                const storageKey = `opeari_onboarding_progress_${user.id}`
                const isInvite = searchParams.get('source') === 'invite' || searchParams.get('invite')

                // If this is an invite flow, we skip restoring old progress to ensure they start fresh
                // UNLESS they have completed onboarding before (handled by not showing onboarding at all typically, but good to be safe)
                if (isInvite) {
                    console.log('Invite flow detected: Skipping local storage restore to force fresh start.')
                }

                try {
                    const saved = localStorage.getItem(storageKey)
                    if (saved && !isInvite) {
                        const parsed = JSON.parse(saved)
                        // Restore Data (Non-destructive patch)
                        if (parsed.data) {
                            setData(prev => {
                                const next = { ...prev }
                                let changed = false
                                Object.keys(parsed.data).forEach(k => {
                                    const key = k as keyof OnboardingData;
                                    const val = parsed.data[key];
                                    // Only apply if stored value is non-empty AND prev is empty
                                    // Handle strings with trim, others just truthy check
                                    const isNonEmpty = typeof val === 'string' ? val.trim() : (val !== null && val !== undefined);

                                    if (isNonEmpty && (prev[key] === null || prev[key] === undefined || prev[key] === '')) {
                                        (next as any)[key] = val; // Direct assignment to preserve type
                                        changed = true;
                                    }
                                })
                                return changed ? next : prev
                            })
                        }
                        // Restore Step (Update URL)
                        if (typeof parsed.step === 'number') {
                            setSearchParams({ step: String(parsed.step) })
                        }
                        console.log('Restored progress from local storage')
                    }
                } catch (e) {
                    console.error('Failed to restore progress', e)
                    localStorage.removeItem(storageKey)
                } finally {
                    setHasRestored(true);
                }


                // --- PHASE 1: PREFILL LOGIC (REVISED) ---
                // Helper to safely get string
                const safeStr = (val: any) => val ? String(val).trim() : ''

                // 1. Fetch from 'members'
                const { data: member } = await supabase
                    .from('members')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle()

                // Check what we have from Members + Auth Metadata to decide if Waitlist is needed
                const hasFirst = !!(member?.first_name || user.user_metadata?.first_name)
                const hasLast = !!(member?.last_name || user.user_metadata?.last_name)
                const hasZip = !!member?.zip_code
                const hasPhone = !!member?.phone

                let waitlistEntry = null
                let waitlistQueried = false

                // 2. Conditional Waitlist Fetch
                // Only query if we are missing key fields
                if ((!hasFirst || !hasLast || !hasZip || !hasPhone) && user.email) {
                    waitlistQueried = true
                    const { data: wl } = await supabase
                        .from('waitlist')
                        .select('*')
                        .ilike('email', user.email)
                        .maybeSingle()
                    waitlistEntry = wl
                }

                // Temporary Debug Log
                console.log(`Prefill: members=[${member ? 'yes' : 'no'}], waitlist=[${waitlistQueried ? 'queried' : 'skipped'}]`)

                // 3. Non-Destructive Merge Strategy
                // Only update a field if logic provides a value AND current state is empty

                setData(prev => {
                    const next = { ...prev }
                    let changed = false

                    const trySet = (key: keyof OnboardingData, val: any) => {
                        const current = prev[key];

                        // Array Handling
                        if (Array.isArray(val) && Array.isArray(current)) {
                            // Only overwrite if current array is empty
                            if (val.length > 0 && current.length === 0) {
                                (next as any)[key] = val;
                                changed = true;
                            }
                            return;
                        }

                        // String/Primitive Handling
                        const cleanVal = safeStr(val)
                        // If we have a new value, AND the current state is empty/falsy
                        if (cleanVal && !current) {
                            (next as any)[key] = cleanVal
                            changed = true
                        }
                    }

                    // Migration: If we have legacy care_options in member row (stored as text array usually, or we might not have it mapped yet)
                    // Currently we don't fetch care_options from DB in the select('*') but if we did:
                    // For now, let's just ensure if we restore from localstorage and it has careOptions but not careNeedOptions, we map it.
                    // This is handled in the Restore Local Storage block if we did it right, but let's add a safety check here for the 'next' object state.

                    // Actually, let's look at Step 61 in useOnboarding which restores data.
                    // We might need to patch the restore logic.
                    // But for now, let's just make sure we default properly.



                    // Name
                    trySet('firstName', member?.first_name || waitlistEntry?.first_name || user.user_metadata?.first_name)
                    trySet('lastName', member?.last_name || waitlistEntry?.last_name || user.user_metadata?.last_name)

                    // Contact
                    // Email is special: we always trust Auth if missing
                    if (!prev.email && user.email) {
                        next.email = user.email
                        changed = true
                    }
                    trySet('zipCode', member?.zip_code || waitlistEntry?.zip_code)
                    trySet('phone', member?.phone || waitlistEntry?.phone)

                    // Intent Logic
                    if (!prev.intent) {
                        let detectedIntent = null
                        const mRole = member?.role
                        const wRole = waitlistEntry?.role

                        // Strict Canonical Signals Only
                        if (mRole === 'family') detectedIntent = 'family'
                        else if (mRole === 'caregiver') detectedIntent = 'caregiver'
                        else if (wRole === 'family') detectedIntent = 'family'
                        else if (wRole === 'caregiver') detectedIntent = 'caregiver'

                        // Legacy support for existing rows (if not yet migrated)
                        else if (mRole === 'parent') detectedIntent = 'family'
                        else if (mRole === 'nanny') detectedIntent = 'caregiver'

                        if (detectedIntent) {
                            next.intent = detectedIntent as any
                            changed = true
                        }
                    }

                    return changed ? next : prev
                })

            } catch (error) {
                console.error('Error loading profile:', error)
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [])

    // --- PHASE 2: PERSISTENCE EFFECT ---
    useEffect(() => {
        if (!userId || !hasRestored) return

        const storageKey = `opeari_onboarding_progress_${userId}`
        const payload = {
            step,
            data
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
    }, [userId, step, data])

    useEffect(() => {
        // Safety: If user lands on Step 6 (legacy) or higher, redirect to Step 5 (Account)
        // so they can click "See My Village" to finish.
        const intent = data.intent;
        const isCaregiver = intent === 'caregiver';

        // Invite Override: If this is an invite flow, we ignore legacy step limits or completion
        const isInvite = searchParams.get('source') === 'invite' || searchParams.get('invite');
        if (isInvite) return;

        // STEP GUARD: Prevent skipping to Step 5 (Account) if Step 0 or 1 is not valid/complete
        // This stops users from hitting /onboarding?step=5 directly
        if (step >= 5) {
            // Check essential requirements
            // Basic Requirement: Intent + First Name + Zip
            const hasBasicInfo = !!(data.intent && data.firstName && data.zipCode);

            if (!hasBasicInfo) {
                console.warn('Step Guard: Attempted to access Step 5 without basics. Redirecting to Step 0.');
                setStep(0);
                return;
            }
        }

        if (step > 5 && !isCaregiver) {
            setStep(5);
        }
    }, [step, data.intent, searchParams, data.firstName, data.zipCode]);



    const updateData = (field: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
    };

    const [saveError, setSaveError] = useState<string | null>(null);

    const handleFinish = async () => {
        setLoading(true);
        setSaveError(null);
        console.log('=== ONBOARDING SAVE START ===');

        try {
            // 1. Determine Canonical Intent
            const rawIntent = data.intent;
            // Already normalized by type, but ensuring we just use it directly
            const canonicalIntent = rawIntent;

            if (!canonicalIntent || (canonicalIntent !== 'caregiver' && canonicalIntent !== 'family')) {
                console.error('CRITICAL: Unknown intent during save:', rawIntent);
                setSaveError('Invalid account type selected. Please refresh and try again.');
                setLoading(false);
                return;
            }

            // CRITICAL: Ensure Member Row Exists & Validate Session
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser || !authUser.email) {
                console.error('CRITICAL: No authenticated user or EMAIL found during save.');
                setSaveError('Your session appears invalid. Please try refreshing or logging in again.');
                setLoading(false);
                return;
            }

            // double check guarantees
            await ensureMemberRow();

            if (authUser) {
                const updates: any = {
                    data: {
                        intent: canonicalIntent, // Standardized key
                        first_name: data.firstName || '',
                        last_name: data.lastName || '',
                        onboarding_complete: true
                    }
                };

                // Only add password if it exists and is valid length
                if (data.password && data.password.length >= 6) {
                    updates.password = data.password;
                }

                console.log('Sanitized updates payload:', updates);
                let { error: updateError } = await supabase.auth.updateUser(updates);

                // RETRY LOGIC: If password is same as old one (422), retry without password
                if (updateError && (updateError.status === 422 || updateError.message.toLowerCase().includes("password"))) {
                    console.warn('Password update failed (likely same as old). Retrying metadata update only...');
                    delete updates.password;
                    const retry = await supabase.auth.updateUser(updates);
                    updateError = retry.error;
                }

                if (updateError) {
                    console.error('Failed to update user metadata:', updateError);
                    setSaveError(updateError.message);
                    setLoading(false);
                    return;
                } else {
                    console.log('User metadata updated successfully');
                }
            }

            if (!authUser) {
                console.error('NO AUTH USER FOUND');
                throw new Error('No user session found');
            }

            // 3. Save Logic (Wrapped in Timeout)
            const savePromise = async () => {
                // ... (Original logic for Family/Caregiver save moved here) ...
                // 2. Branch Logic based on Canonical Intent

                // --- CAREGIVER SAVE LOGIC ---
                if (canonicalIntent === 'caregiver') {
                    console.log('Starting Caregiver Save Sequence...');

                    // A. Upsert Base Member Profile (Shared Data) - ensures row exists
                    const memberUpdatePayload = {
                        first_name: data.firstName,
                        last_name: data.lastName,
                        // Email REQUIRED for Not-Null Constraint
                        email: authUser.email,
                        phone: data.phone,
                        zip_code: data.zipCode,
                        neighborhood: data.neighborhood,
                        bio: data.bio, // Shared bio
                    };

                    const { error: memberError } = await supabase
                        .from('members')
                        .upsert({ id: authUser.id, ...memberUpdatePayload });

                    if (memberError) {
                        console.error('Error upserting member base data:', memberError);
                        throw memberError;
                    }

                    // Map Logistics to Transportation "Own Car" if applicable
                    let transportation = 'none';
                    if (data.logistics?.includes('own_car')) transportation = 'own_car';
                    else if (data.logistics?.includes('driver_license')) transportation = 'own_car';

                    // B. Upsert Caregiver Profile (Professional Data)
                    // Strict adherence to data_contract.md - only profile fields
                    const caregiverPayload = {
                        user_id: authUser.id,

                        // Professional Details
                        role_type: data.caregiverRole,
                        secondary_roles: data.secondaryRoles || [],
                        years_experience: data.yearsExperience,
                        hourly_rate: data.hourlyRate ? parseInt(data.hourlyRate.replace(/[^0-9]/g, ''), 10) : null,
                        logistics: data.logistics || [],

                        // JSONB Structures
                        certifications: data.certifications?.map(c => ({ name: c, verified: false })) || [],

                        // Existing Fields from V4/Settings
                        age_groups: data.ageGroups || [],
                        languages: [],

                        // Derived/Mapped Fields
                        transportation: transportation,
                        availability_days: [],
                        availability_blocks: [],

                        // Status Flags - REMOVED
                    };

                    console.log('Upserting Caregiver Profile:', caregiverPayload);

                    const { error: cgError } = await supabase
                        .from('caregiver_profiles')
                        .upsert(caregiverPayload, { onConflict: 'user_id' })
                        .select();

                    if (cgError) {
                        console.error('Error upserting caregiver profile:', cgError);
                        throw cgError;
                    }
                } else {
                    // --- FAMILY SAVE LOGIC ---
                    // Calculate Vetting Requirements
                    determineVettingRequirements(data, data.hostingInterest);

                    // Helpers for derived fields
                    const deriveAgeGroups = (kids: any[]) => {
                        const groups: string[] = [];
                        kids.forEach(k => {
                            // CHANGED: Use birthYear to calculate age
                            if (!k.birthYear) return;
                            const currentYear = new Date().getFullYear();
                            const age = currentYear - parseInt(k.birthYear);
                            if (isNaN(age)) return; // Skip if invalid

                            if (age <= 1) groups.push('infant');
                            else if (age <= 3) groups.push('toddler');
                            else if (age <= 5) groups.push('preschool');
                            else if (age <= 12) groups.push('school_age');
                            else groups.push('teen');
                        });
                        return [...new Set(groups)]; // Unique
                    };

                    const deriveAvailability = (schedule: Record<string, string[]>) => {
                        const days = new Set<string>();
                        const blocks = new Set<string>();

                        Object.entries(schedule).forEach(([day, times]) => {
                            if (times && times.length > 0) {
                                days.add(day);
                                times.forEach(t => blocks.add(t)); // Assuming schedule uses same block keys: morning, afternoon, etc.
                            }
                        });

                        return {
                            days: Array.from(days),
                            blocks: Array.from(blocks)
                        };
                    };

                    const { days, blocks } = deriveAvailability(data.schedule);

                    const userPayload = {
                        // Shared Identity
                        first_name: data.firstName,
                        last_name: data.lastName || '',
                        // Email REQUIRED for Not-Null Constraint
                        email: authUser.email,
                        zip_code: data.zipCode,
                        neighborhood: data.neighborhood,

                        role: 'family',

                        // New Intel-Lite Fields
                        hosting_interest: (data.careOfferOptions || []).includes('host-share'), // Derived Single Source of Truth

                        // Persist Split Arrays
                        care_need_options: data.careNeedOptions || [],
                        care_offer_options: data.careOfferOptions || [],
                        care_specific_needs: data.careSpecificNeeds || null,

                        target_budget: null, // Legacy field (optional to keep or remove, setting null to safe)
                        target_budget_range: data.targetBudget || null, // New Stable Field

                        current_care_setup: data.currentCareSetup || null,

                        // Mapped Arrays
                        children_age_groups: deriveAgeGroups(data.kids),
                        availability_days: days,
                        availability_blocks: blocks,

                        schedule: {
                            flexible: data.scheduleFlexible,
                            grid: data.schedule
                        },

                        // Derived Bio
                        // Generating bio from new strict fields
                        bio: data.bio || `Looking for: ${(data.careNeedOptions || []).join(', ')}`,
                        languages: [], // Default
                    };

                    const { error } = await supabase
                        .from('members')
                        .upsert({ id: authUser.id, ...userPayload });

                    if (error) throw error;
                }
            };

            // TIMEOUT WRAPPER
            const TIMEOUT_MS = 15000; // 15s hard timeout
            await Promise.race([
                savePromise(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please try again.')), TIMEOUT_MS))
            ]);

            console.log('=== ONBOARDING SAVE SUCCESS ===');
            // Clear LocalStorage on success
            if (authUser) {
                localStorage.removeItem(`opeari_onboarding_progress_${authUser.id}`)
            }

            // Navigate to Success Page (Village Reveal)
            navigate('/onboarding-success');
        } catch (err: any) {
            console.error('=== ONBOARDING SAVE FAILED ===', err);
            // If it's a Supabase error it might have details
            if (err.message) console.error('Error Message:', err.message);
            if (err.details) console.error('Error Details:', err.details);
            if (err.hint) console.error('Error Hint:', err.hint);

            setSaveError(err.message || 'Failed to check save.');
            // DO NOT set showSuccess here!
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        // Shared Step 0
        if (step === 0) return !!data.intent;

        // Normalize for validation check
        const intent = data.intent;
        const isCaregiver = intent === 'caregiver';

        // Caregiver Flow
        if (isCaregiver) {
            switch (step) {
                case 1: return !!(data.firstName && data.lastName && data.phone && data.phone.replace(/\D/g, '').length === 10 && data.zipCode?.length === 5); // About
                case 2: return !!(data.caregiverRole && data.yearsExperience && data.ageGroups?.length && data.bio); // Experience
                case 3: return !!data.availabilityType; // Availability
                case 4: return true; // Verification (Informational)
                case 5: return !!(data.password && data.password.length >= 8 && data.password === passwordConfirm); // Account
                default: return true;
            }
        }

        // Family Flow (Existing)
        switch (step) {
            case 1: return !!(data.firstName?.trim() && data.zipCode?.trim() && data.zipCode.length === 5);
            // Updated validation: MUST have at least 1 need OR "something else" with text
            // Offers alone are not enough to proceed as a Family
            case 2: {
                const hasNeeds = data.careNeedOptions && data.careNeedOptions.length > 0;
                const isSomethingElse = hasNeeds && data.careNeedOptions.includes('something-else');

                // If "something else" is selected, require valid text
                if (isSomethingElse) {
                    return !!(data.careSpecificNeeds && data.careSpecificNeeds.trim().length > 0);
                }

                // Otherwise just need at least one option
                return hasNeeds;
            }
            case 3: return true;
            case 4: return true;
            case 5: return !!(data.password && data.password.length >= 8 && data.password === passwordConfirm);
            default: return true;
        }
    };

    return {
        step,
        data,
        loading,

        passwordConfirm,
        // Removed local hostingInterest state return, now in data
        showSomethingElseInput,
        setStep,
        setData,
        setPasswordConfirm,
        // Removed setHostingInterest return
        setShowSomethingElseInput,
        updateData,
        nextStep,
        prevStep,
        handleFinish,
        navigate,
        isStepValid,
        saveError
    };
}
