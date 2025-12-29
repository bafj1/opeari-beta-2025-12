import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';
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
    const [showSuccess, setShowSuccess] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');

    // UI Local state that doesn't need to be in main data object but affects UI
    const [hostingInterest, setHostingInterest] = useState(false);
    const [showSomethingElseInput, setShowSomethingElseInput] = useState(false);

    // Auth Check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setData(prev => ({
                    ...prev,
                    email: session.user.email || '',
                    firstName: session.user.user_metadata?.first_name || '',
                    lastName: session.user.user_metadata?.last_name || ''
                }));
            } else {
                // Should be caught by ProtectedRoute, but double check
                navigate('/signin');
            }
        };
        checkUser();
    }, []);

    // Confetti on Success
    useEffect(() => {
        if (showSuccess) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4A7C59', '#E8B4A0', '#F5E6D3', '#8FBC8F'] // Brand colors
            });
        }
    }, [showSuccess]);

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
            const { data: { user: authUser } } = await supabase.auth.getUser();
            console.log('Auth user:', authUser?.id, authUser?.email);

            if (authUser && data.password) {
                await supabase.auth.updateUser({ password: data.password });
            }

            if (!authUser) {
                console.error('NO AUTH USER FOUND');
                throw new Error('No user session found');
            }

            // --- CAREGIVER SAVE LOGIC ---
            if (data.userIntent === 'providing') {
                const caregiverPayload = {
                    user_id: authUser.id,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    zip_code: data.zipCode,
                    // role_type: data.caregiverRole, // Map if needed
                    role_type: data.caregiverRole,
                    years_experience: data.yearsExperience,
                    age_groups: data.ageGroups,
                    certifications: data.certifications,
                    bio: data.bio,
                    availability_type: data.availabilityType,
                    schedule_notes: data.scheduleNotes,
                    status: 'pending',
                    background_check_status: 'not_started'
                };

                console.log('Caregiver Payload:', caregiverPayload);

                const { error } = await supabase
                    .from('caregiver_profiles')
                    .upsert(caregiverPayload);

                if (error) throw error;

            } else {
                // --- FAMILY SAVE LOGIC (Existing) ---
                // Calculate Vetting Requirements
                const { vetting_required, vetting_types } = determineVettingRequirements(data, hostingInterest);
                const vetting_status = vetting_required ? 'required' : 'not_required';

                const userPayload = {
                    first_name: data.firstName,
                    last_name: data.lastName || '',
                    zip_code: data.zipCode,
                    address: data.neighborhood,
                    role: 'parent',
                    care_types: data.careOptions,
                    schedule: {
                        flexible: data.scheduleFlexible,
                        grid: data.schedule
                    },
                    is_flexible: data.scheduleFlexible,
                    num_kids: data.kids.length,
                    kids_ages: data.kids.map(k => parseInt(k.age) || 0),
                    bio: `Looking for: ${data.careOptions.join(', ')}`,
                    timeline: 'asap',
                    profile_complete: true,
                    other_needs: showSomethingElseInput ? data.specificNeeds : null,
                    just_exploring: data.careOptions.includes('exploring'),
                    metadata: {
                        expecting: data.expecting,
                        expecting_timing: data.expectingTiming,
                    },
                    user_intent: data.userIntent,
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
            setShowSuccess(true);
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

        // Caregiver Flow
        if (data.userIntent === 'providing') {
            switch (step) {
                case 1: return !!(data.firstName && data.lastName && data.phone && data.zipCode?.length === 5); // About
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
        showSuccess,
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
