import { User, HandHeart } from 'lucide-react';
import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader } from '../components/WizardUI';

interface IntentStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
    hostingInterest: boolean;
    setHostingInterest: (val: boolean) => void;
}

export default function IntentStep({ data, updateData, hostingInterest, setHostingInterest }: IntentStepProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="What brings you to Opeari?" subtitle="Select what fits you best" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                    onClick={() => updateData('userIntent', 'seeking')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-3 ${data.userIntent === 'seeking' ? 'border-[#1e6b4e] bg-[#8bd7c7]' : 'border-gray-200 bg-white hover:border-opeari-mint'}`}
                >
                    <div className={`p-3 rounded-full flex items-center justify-center ${data.userIntent === 'seeking' ? 'bg-[#1e6b4e] text-white' : 'bg-[#F8C3B3]/40 text-[#1e6b4e]'}`}>
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-opeari-heading">I'm exploring care options</h3>
                        <p className="text-xs text-gray-500 mt-1">Find shared nannies, flexible support, and trusted care</p>
                    </div>
                </div>

                <div
                    onClick={() => updateData('userIntent', 'providing')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-3 ${data.userIntent === 'providing' ? 'border-[#1e6b4e] bg-[#8bd7c7]' : 'border-gray-200 bg-white hover:border-opeari-mint'}`}
                >
                    <div className={`p-3 rounded-full flex items-center justify-center ${data.userIntent === 'providing' ? 'bg-[#1e6b4e] text-white' : 'bg-[#F8C3B3]/40 text-[#1e6b4e]'}`}>
                        <HandHeart size={24} /> {/* Verified: HandHeart icon */}
                    </div>
                    <div>
                        <h3 className="font-bold text-opeari-heading">I provide childcare</h3>
                        <p className="text-xs text-gray-500 mt-1">Connect with families seeking care</p>
                    </div>
                </div>
            </div>

            {data.userIntent === 'seeking' && (
                <div className="animate-fade-in pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[#e8f5f0] cursor-pointer hover:bg-[#d8f5e5] transition-colors select-none">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={hostingInterest}
                                onChange={(e) => setHostingInterest(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all bg-white border-[#1e6b4e] peer-checked:bg-[#1e6b4e] peer-checked:border-[#1e6b4e] peer-focus:ring-2 peer-focus:ring-[#8bd7c7] peer-focus:ring-offset-1`}
                            >
                                {hostingInterest && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-opeari-heading">I can host care at my home</span>
                            <span className="text-xs text-[#1e6b4e]/60 font-medium">Optional — helps us understand what setups might work</span>
                        </div>
                    </label>
                </div>
            )}
        </div>
    );
}
