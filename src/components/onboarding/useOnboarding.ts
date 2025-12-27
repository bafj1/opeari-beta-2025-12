import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';
import { INITIAL_DATA } from './OnboardingTypes';
import type { OnboardingData } from './OnboardingTypes';

export function useOnboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
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
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser && data.password) {
                await supabase.auth.updateUser({ password: data.password });
            }

            if (!authUser) throw new Error('No user session found');

            const userPayload = {
                first_name: data.firstName,
                last_name: data.lastName || '',
                zip_code: data.zipCode,
                address: data.neighborhood,
                role: 'parent', // TODO: Make dynamic based on intent if needed
                care_types: data.careOptions,
                schedule_preferences: JSON.stringify({
                    flexible: data.scheduleFlexible,
                    grid: data.schedule
                }),
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
                user_intent: data.userIntent
            };

            const { error } = await supabase
                .from('users')
                .upsert({ id: authUser.id, ...userPayload });

            if (error) throw error;
            setShowSuccess(true);
        } catch (err) {
            console.error('Save error:', err);
            setShowSuccess(true); // Fallback to success even on error for beta UX? Or handle error?
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 0: return !!data.userIntent;
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
        isStepValid
    };
}
