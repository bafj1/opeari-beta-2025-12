import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { INITIAL_DATA } from './OnboardingTypes';
import type { OnboardingData } from './OnboardingTypes';
import { determineVettingRequirements } from '../../lib/vetting';

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
    const [hostingInterest, setHostingInterest] = useState(false);
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
                try {
                    const saved = localStorage.getItem(storageKey)
                    if (saved) {
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

                                    if (isNonEmpty && !prev[key]) {
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
                        const cleanVal = safeStr(val)
                        // If we have a new value, AND the current state is empty/falsy
                        if (cleanVal && !prev[key]) {
                            (next as any)[key] = cleanVal
                            changed = true
                        }
                    }

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
                    if (!prev.userIntent) {
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
                            next.userIntent = detectedIntent as any
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
        const intent = data.userIntent;
        const isCaregiver = intent === 'caregiver';

        if (step > 5 && !isCaregiver) {
            setStep(5);
        }
    }, [step, data.userIntent]);



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
            const rawIntent = data.userIntent;
            // Already normalized by type, but ensuring we just use it directly
            const canonicalIntent = rawIntent;

            if (!canonicalIntent || (canonicalIntent !== 'caregiver' && canonicalIntent !== 'family')) {
                console.error('CRITICAL: Unknown intent during save:', rawIntent);
                setSaveError('Invalid account type selected. Please refresh and try again.');
                setLoading(false);
                return;
            }

            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const updates: any = {
                    data: {
                        intent: canonicalIntent,
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

            // 2. Branch Logic based on Canonical Intent

            // --- CAREGIVER SAVE LOGIC ---
            if (canonicalIntent === 'caregiver') {
                console.log('Starting Caregiver Save Sequence...');

                // A. Upsert Base Member Profile (Shared Data) - ensures row exists
                const memberUpdatePayload = {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    phone: data.phone,
                    zip_code: data.zipCode,
                    neighborhood: data.neighborhood,
                    bio: data.bio, // Shared bio

                    // VILLAGE INTENT (Canonical Persistence)
                    support_needed: [],
                    support_offered: [],
                    support_notes: null
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
                // Note: Logic runs but fields only persisted if in contract
                determineVettingRequirements(data, hostingInterest);

                // Helpers for derived fields
                const deriveAgeGroups = (kids: any[]) => {
                    const groups: string[] = [];
                    kids.forEach(k => {
                        const age = parseInt(k.age);
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
                    // email: REMOVED
                    zip_code: data.zipCode,
                    neighborhood: data.neighborhood,

                    role: 'family',
                    care_types: data.careOptions,

                    // Mapped Arrays
                    children_age_groups: deriveAgeGroups(data.kids),
                    availability_days: days,
                    availability_blocks: blocks,

                    schedule: {
                        flexible: data.scheduleFlexible,
                        grid: data.schedule
                    },

                    // Derived Bio
                    bio: data.bio || `Looking for: ${data.careOptions.join(', ')}`,
                    languages: [], // Default

                    // VETTING FLAGS (Derived but not persisted unless schema matches - kept for now as derived logic usage is ambiguous, but contract says NO vetting fields in members table. Commenting out to be safe based on "Remove fields like vetting_*")
                    // vetting_required,
                    // vetting_types,
                    // vetting_status,
                    // vetting_fee_acknowledged: false,

                    // VILLAGE INTENT (Canonical Persistence)
                    // Currently populated via Settings, but seeded empty here to ensure column presence
                    support_needed: [],
                    support_offered: [],
                    support_notes: null
                };

                const { error } = await supabase
                    .from('members')
                    .upsert({ id: authUser.id, ...userPayload });

                if (error) throw error;
            }

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
        if (step === 0) return !!data.userIntent;

        // Normalize for validation check
        const intent = data.userIntent;
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
            case 2: return data.careOptions.length > 0 || showSomethingElseInput;
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
        hostingInterest,
        showSomethingElseInput,
        setStep,
        setData,
        setPasswordConfirm,
        setHostingInterest,
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
