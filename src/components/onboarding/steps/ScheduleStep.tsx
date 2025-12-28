import { Check } from 'lucide-react';
import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader } from '../components/WizardUI';
import { ScheduleGrid } from '../components/ScheduleGrid';

interface ScheduleStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

export default function ScheduleStep({ data, updateData }: ScheduleStepProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="Your Schedule" subtitle="Just a rough idea." />

            <div
                onClick={() => updateData('scheduleFlexible', !data.scheduleFlexible)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${data.scheduleFlexible ? 'border-opeari-heading bg-[#f0faf4]' : 'border-gray-200'}`}
            >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${data.scheduleFlexible ? 'bg-opeari-heading border-opeari-heading' : 'border-gray-300'}`}>
                    {data.scheduleFlexible && <Check size={14} className="text-white" />}
                </div>
                <div>
                    <p className="font-semibold text-opeari-heading">My schedule is flexible</p>
                    <p className="text-sm text-gray-500">Totally fine — many families start here</p>
                </div>
            </div>

            {/* Grid - Dimmed if flexible, but still interactive */}
            <div className={`transition-all duration-300 ${data.scheduleFlexible ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}>
                <ScheduleGrid
                    value={data.schedule}
                    onChange={(v: any) => updateData('schedule', v)}
                />
            </div>

            {data.userIntent === 'providing' && (
                <div className="pt-2 animate-fade-in">
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={data.readyToStart}
                                onChange={(e) => updateData('readyToStart', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all bg-white group-hover:border-opeari-green ${data.readyToStart ? 'bg-opeari-green border-opeari-green' : 'border-gray-300'}`}>
                                {data.readyToStart && <Check size={14} className="text-white" />}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-opeari-heading block">I'm ready to start now</span>
                            <span className="text-xs text-gray-500">This helps us prioritize active matches</span>
                        </div>
                    </label>
                </div>
            )}
        </div>
    );
}
