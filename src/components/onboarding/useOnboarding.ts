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
                        const metaIntent = user.user_metadata?.intent

                        if (mRole === 'parent' || mRole === 'family') detectedIntent = 'family'
                        else if (mRole === 'caregiver' || mRole === 'nanny') detectedIntent = 'caregiver'
                        else if (wRole === 'family') detectedIntent = 'family'
                        else if (wRole === 'caregiver') detectedIntent = 'caregiver'
                        else if (metaIntent === 'family' || metaIntent === 'seeking') detectedIntent = 'family'
                        else if (metaIntent === 'caregiver' || metaIntent === 'providing') detectedIntent = 'caregiver'

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
                        last_name: data.lastName || ''
                    }
                };

                // Only add password if it exists and is valid length
                if (data.password && data.password.length >= 6) {
                    updates.password = data.password;
                }

                console.log('Sanitized updates payload:', updates);
                const { error: updateError } = await supabase.auth.updateUser(updates);

                if (updateError) {
                    console.error('Failed to update user metadata (422?):', updateError);
                    // Don't throw here to allow flow to finish, but at least we know.
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
                const caregiverPayload = {
                    user_id: authUser.id,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    zip_code: data.zipCode,
                    role_type: data.caregiverRole,
                    secondary_roles: data.secondaryRoles,
                    years_experience: data.yearsExperience,
                    age_groups: data.ageGroups,
                    // Transform for V4 Schema (JSONB)
                    certifications: data.certifications?.map(c => ({ name: c, verified: false })),
                    bio: data.bio,
                    availability_type: data.availabilityType,
                    schedule_notes: data.scheduleNotes,
                    status: 'pending',
                    background_check_status: 'not_started',
                    // V3 New Fields
                    hourly_rate: data.hourlyRate,
                    logistics: data.logistics,
                    referrals: data.referrals
                };

                console.log('Caregiver Payload:', caregiverPayload);

                const { error } = await supabase
                    .from('caregiver_profiles')
                    .upsert(caregiverPayload);

                if (error) throw error;

            } else {
                // --- FAMILY SAVE LOGIC ---
                // Calculate Vetting Requirements
                const { vetting_required, vetting_types } = determineVettingRequirements(data, hostingInterest);
                const vetting_status = vetting_required ? 'required' : 'not_required';

                const userPayload = {
                    first_name: data.firstName,
                    last_name: data.lastName || '',
                    email: authUser.email || data.email, // REQUIRED by DB
                    zip_code: data.zipCode,
                    address: data.neighborhood,
                    role: 'parent',
                    care_types: data.careOptions,
                    schedule: {
                        flexible: data.scheduleFlexible,
                        grid: data.schedule
                    },
                    // is_flexible column removed as it doesn't exist in DB schema
                    num_kids: data.kids.length,
                    kids_ages: data.kids.map(k => parseInt(k.age) || 0),
                    bio: data.bio || `Looking for: ${data.careOptions.join(', ')}`,
                    timeline: 'asap',
                    profile_complete: true,
                    // other_needs: showSomethingElseInput ? data.specificNeeds : null,
                    // metadata: { ... }, 
                    // photo_url: ...
                    user_intent: canonicalIntent, // Use canonical here too
                    caregiver_work_types: null,
                    ready_to_start: null,

                    // VETTING FLAGS
                    vetting_required,
                    vetting_types,
                    vetting_status,
                    vetting_fee_acknowledged: false
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
