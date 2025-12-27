import { User, Check } from 'lucide-react';
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
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-3 ${data.userIntent === 'seeking' ? 'border-opeari-heading bg-[#f0faf4]' : 'border-gray-200 bg-white hover:border-opeari-mint'}`}
                >
                    <div className={`p-3 rounded-full flex items-center justify-center ${data.userIntent === 'seeking' ? 'bg-opeari-heading text-white' : 'bg-[#fffaf5] text-[#1e6b4e]'}`}>
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-opeari-heading">I'm looking for childcare</h3>
                        <p className="text-xs text-gray-500 mt-1">Find nanny shares, backup care, and trusted support</p>
                    </div>
                </div>

                <div
                    onClick={() => updateData('userIntent', 'providing')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-3 ${data.userIntent === 'providing' ? 'border-opeari-heading bg-[#f0faf4]' : 'border-gray-200 bg-white hover:border-opeari-mint'}`}
                >
                    <div className={`p-3 rounded-full flex items-center justify-center ${data.userIntent === 'providing' ? 'bg-opeari-heading text-white' : 'bg-[#fffaf5] text-[#1e6b4e]'}`}>
                        <Check size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-opeari-heading">I provide childcare</h3>
                        <p className="text-xs text-gray-500 mt-1">Connect with families who need help</p>
                    </div>
                </div>
            </div>

            {data.userIntent === 'seeking' && (
                <div className="animate-fade-in pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[#e8f5f0] cursor-pointer hover:bg-[#d8f5e5] transition-colors">
                        <input
                            type="checkbox"
                            checked={hostingInterest}
                            onChange={(e) => setHostingInterest(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-opeari-heading focus:ring-opeari-heading"
                        />
                        <span className="text-sm font-medium text-opeari-heading">I'm open to hosting care at my home sometimes</span>
                    </label>
                </div>
            )}
        </div>
    );
}
