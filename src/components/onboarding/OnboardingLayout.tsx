import type { ReactNode } from 'react';
import { STEPS } from './OnboardingTypes';

interface OnboardingLayoutProps {
    children: ReactNode;
    step: number;
}

export default function OnboardingLayout({ children, step }: OnboardingLayoutProps) {
    const currentStepConfig = STEPS.find(s => s.id === step) || STEPS[0];

    return (
        <div className="min-h-screen bg-opeari-bg flex items-center justify-center p-0 md:p-6" style={{ fontFamily: "'Comfortaa', sans-serif" }}>

            <div className="w-full max-w-6xl md:h-[min(800px,90vh)] bg-white md:rounded-3xl md:shadow-[0_25px_50px_-12px_rgba(30,107,78,0.25)] overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-0">

                {/* LEFT PANEL */}
                <div className="hidden md:flex md:w-[40%] bg-opeari-bg flex-col items-center justify-center p-12 text-center relative transition-all duration-500 border-none">

                    {currentStepConfig.img && (
                        <div className="w-48 h-48 mb-6 transition-opacity duration-500">
                            <img
                                key={`img-${step}`}
                                src={currentStepConfig.img}
                                alt={`Step ${step}`}
                                className="w-full h-full object-contain animate-fade-in"
                            />
                        </div>
                    )}
                    <p key={`txt-${step}`} className="text-xl text-[#1e6b4e] font-medium leading-relaxed animate-fade-in whitespace-pre-line">
                        {currentStepConfig.text}
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative">
                    {/* Progress Bar */}
                    <div className="h-1 w-full">
                        <div
                            className="h-full bg-opeari-green transition-all duration-500"
                            style={{ width: `${(step / 6) * 100}%` }}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pt-24 md:p-12">
                        <div className="max-w-xl mx-auto space-y-8 min-h-[50vh]">
                            {/* Mobile Step 1 Illustration - Only show on relevant steps if needed, or keeping generic for now */}
                            {step === 1 && (
                                <div className="md:hidden flex justify-center mb-4">
                                    <img src="/opeari-welcome-green.png" alt="Welcome" className="w-32 h-32 object-contain" />
                                </div>
                            )}

                            {children}
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
