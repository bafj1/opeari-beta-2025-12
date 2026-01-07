import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useOnboarding } from './useOnboarding';
import OnboardingLayout from './OnboardingLayout';
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
        passwordConfirm,
        // hostingInterest removed
        showSomethingElseInput,
        setPasswordConfirm,
        // setHostingInterest removed
        setShowSomethingElseInput,
        updateData,
        nextStep,
        prevStep,
        handleFinish,
        isStepValid,
        saveError
    } = useOnboarding();

    // Local UI state
    const [showPassword, setShowPassword] = useState(false);

    // showSuccess logic removed - navigated away

    // Scroll to top on step change
    // Handled by useOnboarding setStep already, but adding safety here if needed
    // Actually useOnboarding.ts has window.scrollTo(0, 0) in setStep, so this should be working.
    // Let's verify setStep usage. 
    // Double check scroll behavior. Adding explicit scroll here just in case.

    // Derived state step change
    // We need to listen to step changes
    // But useOnboarding handles it.

    // Let's implement handles for Caregiver steps



    const handleNext = () => {
        // Validation handled by disable state of button
        nextStep();
    };

    const renderStep = () => {
        // Shared Step 0: Intent
        // Removed specific hosting props passing, handled via data/updateData inside now
        if (step === 0) return <IntentStep data={data} updateData={updateData} />;

        // --- CAREGIVER FLOW ---
        if (data.intent === 'caregiver') {
            switch (step) {
                case 1: return <CaregiverAboutStep data={data} updateData={updateData} />;
                case 2: return <CaregiverExperienceStep data={data} updateData={updateData} />;
                case 3: return <CaregiverAvailabilityStep data={data} updateData={updateData} />;
                case 4: return <CaregiverVerificationStep data={data} updateData={updateData} />;
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
        <OnboardingLayout step={step} intent={data.intent}>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                            <img src="/icon.svg" alt="Loading" className="w-12 h-12 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-bold text-[#1e6b4e] mb-2 font-comfortaa">Building your village...</h2>
                        <p className="text-[#1e6b4e]/70 text-center font-comfortaa">This will just take a moment.</p>
                    </div>
                </div>
            ) : (
                <>
                    {renderStep()}

                    {/* Save Error Banner */}
                    {saveError && (
                        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-fade-in text-center">
                            {saveError}
                        </div>
                    )}

                    {/* Navigation Footer */}
                    <div className={`pt-8 mt-4 flex gap-4 relative z-50 ${saveError ? 'mt-2' : ''}`}>
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
                                <>See My Village <ArrowRight size={20} /></>
                            ) : 'Next'}
                        </button>
                    </div>
                </>
            )}
        </OnboardingLayout>
    );
}
