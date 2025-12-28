import { Check } from 'lucide-react';
import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, SelectionCard } from '../components/WizardUI';

interface CaregiverWorkTypeStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

export default function CaregiverWorkTypeStep({ data, updateData }: CaregiverWorkTypeStepProps) {

    const toggleWorkType = (id: string) => {
        let newTypes = [...data.caregiverWorkTypes];
        if (id === 'any') {
            newTypes = newTypes.includes('any') ? [] : ['any'];
        } else {
            if (newTypes.includes('any')) newTypes = [];
            if (newTypes.includes(id)) {
                newTypes = newTypes.filter(i => i !== id);
            } else {
                newTypes.push(id);
            }
        }
        updateData('caregiverWorkTypes', newTypes);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="What kind of care work are you looking for?" subtitle="Select all that apply" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                    {
                        id: 'full-time',
                        label: 'Full-time nanny',
                        desc: 'Consistent, ongoing care with one family'
                    },
                    {
                        id: 'part-time',
                        label: 'Part-time / split',
                        desc: 'Mornings, afternoons, or a few days a week'
                    },
                    {
                        id: 'occasional',
                        label: 'Occasional babysitting',
                        desc: 'Date nights, weekends, as-needed'
                    },
                    {
                        id: 'any',
                        label: 'Open to any',
                        desc: 'Flexible on type of work'
                    }
                ].map(opt => (
                    <SelectionCard
                        key={opt.id}
                        icon={Check}
                        label={opt.label}
                        desc={opt.desc}
                        selected={data.caregiverWorkTypes.includes(opt.id)}
                        onClick={() => toggleWorkType(opt.id)}
                        isCheckboxStyle={true}
                    />
                ))}
            </div>
        </div>
    );
}
