import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader } from '../components/WizardUI';

interface CaregiverAvailabilityStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

const AVAILABILITY_TYPES = [
    { id: 'full_time', label: 'Full Time', desc: '30+ hours/week' },
    { id: 'part_time', label: 'Part Time', desc: 'Regular weekly hours' },
    { id: 'occasional', label: 'Occasional', desc: 'Date nights & weekends' },
    { id: 'flexible', label: 'Flexible', desc: 'Open to discussion' }
];

export default function CaregiverAvailabilityStep({ data, updateData }: CaregiverAvailabilityStepProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader
                title="Your Availability"
                subtitle="When are you looking to work?"
            />

            {/* Availability Type */}
            <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-700">General Availability <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 gap-3">
                    {AVAILABILITY_TYPES.map(type => (
                        <button
                            key={type.id}
                            onClick={() => updateData('availabilityType', type.id)}
                            className={`p-4 rounded-xl border text-left transition-all ${data.availabilityType === type.id
                                    ? 'border-opeari-green bg-opeari-green/5 ring-1 ring-opeari-green'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="font-semibold text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Schedule Notes */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Schedule Details or Notes</label>
                <textarea
                    value={data.scheduleNotes}
                    onChange={(e) => updateData('scheduleNotes', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opeari-green focus:border-transparent min-h-[80px]"
                    placeholder="e.g. I'm available Mon/Wed/Fri mornings, but have classes on Tuesdays..."
                />
            </div>
        </div>
    );
}
