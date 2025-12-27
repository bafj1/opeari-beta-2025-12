import { ArrowRight } from 'lucide-react';
import { useOnboarding } from './useOnboarding';
import OnboardingLayout from './OnboardingLayout';
import IntentStep from './steps/IntentStep';
import LocationStep from './steps/LocationStep';
import CareNeedsStep from './steps/CareNeedsStep';
import ScheduleStep from './steps/ScheduleStep';
import FamilyStep from './steps/FamilyStep';
import AccountStep from './steps/AccountStep';

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
        isStepValid
    } = useOnboarding();

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
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-opeari-green text-white py-4 rounded-xl font-bold hover:bg-opeari-green-dark transition-transform hover:-translate-y-0.5 shadow-button hover:shadow-button-hover"
                    >
                        Go to My Dashboard
                    </button>
                </div>
            </div>
        );
    }


    return (
        <OnboardingLayout step={step}>
            <StepContentWithState
                step={step}
                data={data}
                updateData={updateData}
                hostingInterest={hostingInterest}
                setHostingInterest={setHostingInterest}
                showSomethingElseInput={showSomethingElseInput}
                setShowSomethingElseInput={setShowSomethingElseInput}
                passwordConfirm={passwordConfirm}
                setPasswordConfirm={setPasswordConfirm}
            />

            {/* Navigation Footer */}
            <div className="pt-8 mt-4 border-t border-gray-100 flex gap-4">
                {step > 0 && (
                    <button onClick={prevStep} className="px-6 py-4 font-bold text-opeari-heading bg-[#f0faf4] rounded-xl hover:bg-[#e1f5e9] transition-colors">
                        Back
                    </button>
                )}

                <button
                    onClick={step === 5 ? handleFinish : nextStep}
                    disabled={!isStepValid() || loading}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg text-white shadow-button transition-all flex items-center justify-center gap-2
                        ${!isStepValid() || loading ? 'bg-[#e0e0e0] text-[#9e9e9e] cursor-not-allowed shadow-none' : 'bg-opeari-green hover:bg-opeari-green-dark hover:-translate-y-0.5'}
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

// Local wrapper to handle showPassword state cleanly
import { useState } from 'react';

function StepContentWithState(props: any) {
    const [showPassword, setShowPassword] = useState(false);

    switch (props.step) {
        case 0: return <IntentStep {...props} />;
        case 1: return <LocationStep {...props} />;
        case 2: return <CareNeedsStep {...props} />;
        case 3: return <ScheduleStep {...props} />;
        case 4: return <FamilyStep {...props} />;
        case 5: return <AccountStep {...props} showPassword={showPassword} setShowPassword={setShowPassword} />;
        default: return null;
    }
}
