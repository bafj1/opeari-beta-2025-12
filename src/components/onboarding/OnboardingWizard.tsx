import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useOnboarding } from './useOnboarding';
import OnboardingLayout from './OnboardingLayout';
import { determineVettingRequirements } from '../../lib/vetting';
import IntentStep from './steps/IntentStep';
import LocationStep from './steps/LocationStep';
import CareNeedsStep from './steps/CareNeedsStep';
import ScheduleStep from './steps/ScheduleStep';
import FamilyStep from './steps/FamilyStep';
import AccountStep from './steps/AccountStep';
import CaregiverAboutStep from './steps/CaregiverAboutStep';
import CaregiverExperienceStep from './steps/CaregiverExperienceStep';
import CaregiverAvailabilityStep from './steps/CaregiverAvailabilityStep';
import CaregiverVerificationStep from './steps/CaregiverVerificationStep';

export default function OnboardingWizard() {
    const {
        step,
        data,
        loading,
        showSuccess,
        passwordConfirm,
        hostingInterest,
        showSomethingElseInput,
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
    } = useOnboarding();

    // Local UI state
    const [showPassword, setShowPassword] = useState(false);

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-opeari-bg flex items-center justify-center p-4 font-sans text-opeari-text">
                <div className="bg-white rounded-3xl shadow-card p-8 max-w-md w-full text-center animate-fade-in relative overflow-hidden">
                    <div className="w-32 h-32 mx-auto mb-6">
                        <img src="/opeari-match.png" alt="Welcome" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-opeari-heading mb-4">
                        Welcome to the village, {data.firstName}!
                    </h1>
                    <div className="space-y-4 text-gray-600 mb-8">
                        <p>You're early — and that matters.</p>
                        <p>Built by parents, for parents — no algorithms, no marketplaces.</p>
                        <p className="font-medium text-opeari-heading">Just families and caregivers pairing up intentionally.</p>
                    </div>
                    <button
                        onClick={() => {
                            const { vetting_required } = determineVettingRequirements(data, hostingInterest);
                            if (vetting_required) {
                                navigate('/verify');
                            } else {
                                navigate('/dashboard');
                            }
                        }}
                        className="w-full bg-opeari-green text-white py-4 rounded-xl font-bold hover:bg-opeari-green-dark transition-transform hover:-translate-y-0.5 shadow-button hover:shadow-button-hover"
                    >
                        Go to My Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleNext = () => {
        // Validation handled by disable state of button
        nextStep();
    };

    const renderStep = () => {
        // Shared Step 0: Intent
        if (step === 0) return <IntentStep data={data} updateData={updateData} hostingInterest={hostingInterest} setHostingInterest={setHostingInterest} />;

        // --- CAREGIVER FLOW ---
        if (data.userIntent === 'providing') {
            switch (step) {
                case 1: return <CaregiverAboutStep data={data} updateData={updateData} />;
                case 2: return <CaregiverExperienceStep data={data} updateData={updateData} />;
                case 3: return <CaregiverAvailabilityStep data={data} updateData={updateData} />;
                case 4: return <CaregiverVerificationStep />;
                case 5: return (
                    <AccountStep
                        data={data}
                        updateData={updateData}
                        passwordConfirm={passwordConfirm}
                        setPasswordConfirm={setPasswordConfirm}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                    />
                );
                default: return <div>Unknown Step</div>;
            }
        }

        // --- FAMILY FLOW ---
        switch (step) {
            case 1: return <LocationStep data={data} updateData={updateData} />;
            case 2: return <CareNeedsStep data={data} updateData={updateData} showSomethingElseInput={showSomethingElseInput} setShowSomethingElseInput={setShowSomethingElseInput} />;
            case 3: return <ScheduleStep data={data} updateData={updateData} />;
            case 4: return <FamilyStep data={data} updateData={updateData} />;
            case 5: return (
                <AccountStep
                    data={data}
                    updateData={updateData}
                    passwordConfirm={passwordConfirm}
                    setPasswordConfirm={setPasswordConfirm}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                />
            );
            default: return <div>Unknown Step</div>;
        }
    };

    return (
        <OnboardingLayout step={step}>
            {renderStep()}

            {/* Save Error Banner */}
            {saveError && (
                <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-fade-in text-center">
                    {saveError}
                </div>
            )}

            {/* Navigation Footer */}
            <div className={`pt-8 mt-4 flex gap-4 ${saveError ? 'mt-2' : ''}`}>
                {step > 0 && (
                    <button onClick={prevStep} className="px-6 py-4 font-bold text-opeari-heading bg-[#f0faf4] rounded-xl hover:bg-[#e1f5e9] transition-colors border border-[#1e6b4e]">
                        Back
                    </button>
                )}

                <button
                    onClick={step === 5 ? handleFinish : handleNext}
                    disabled={!isStepValid() || loading}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg shadow-button transition-all flex items-center justify-center gap-2
                        ${!isStepValid() || loading ? 'bg-[#e0e0e0] text-[#9e9e9e] cursor-not-allowed shadow-none' : 'bg-[#F8C3B3] text-[#1e6b4e] hover:bg-[#f5b2a1] hover:-translate-y-0.5 border border-[#1e6b4e]/30'}
                    `}
                >
                    {loading ? 'Saving...' : step === 5 ? (
                        <>Complete Setup <ArrowRight size={20} /></>
                    ) : 'Next'}
                </button>
            </div>
        </OnboardingLayout>
    );
}
