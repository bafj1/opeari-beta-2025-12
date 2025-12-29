import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader } from '../components/WizardUI';

interface CaregiverExperienceStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

const ROLES = [
    { id: 'nanny', label: 'Nanny', icon: '👶' },
    { id: 'babysitter', label: 'Babysitter', icon: '🧸' },
    { id: 'au_pair', label: 'Au Pair', icon: '✈️' },
    { id: 'other', label: 'Other', icon: '✨' }
];

const YEARS = [
    { id: '0-1', label: '< 1 Year' },
    { id: '1-3', label: '1-3 Years' },
    { id: '3-5', label: '3-5 Years' },
    { id: '5+', label: '5+ Years' }
];

const AGE_GROUPS = [
    { id: 'infant', label: 'Infant (0-1)' },
    { id: 'toddler', label: 'Toddler (1-3)' },
    { id: 'preschool', label: 'Preschool (3-5)' },
    { id: 'school_age', label: 'School Age (5+)' }
];

const CERTS = [
    { id: 'cpr', label: 'CPR Certified' },
    { id: 'first_aid', label: 'First Aid' },
    { id: 'ece', label: 'Early Childhood Ed' },
    { id: 'driver', label: 'Safe Driver' }
];

export default function CaregiverExperienceStep({ data, updateData }: CaregiverExperienceStepProps) {
    const toggleArrayItem = (field: 'ageGroups' | 'certifications', item: string) => {
        const current = data[field] || [];
        if (current.includes(item)) {
            updateData(field, current.filter(i => i !== item));
        } else {
            updateData(field, [...current, item]);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-8">
            <StepHeader
                title="Your Experience"
                subtitle="Share your background with local families."
            />

            {/* Role Type */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">What is your primary role? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            onClick={() => updateData('caregiverRole', role.id)}
                            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${data.caregiverRole === role.id
                                ? 'border-opeari-green bg-opeari-green/5 text-opeari-dark'
                                : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                        >
                            <span className="text-xl">{role.icon}</span>
                            <span className="font-medium">{role.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Years Experience */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Years of Experience <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                    {YEARS.map(y => (
                        <button
                            key={y.id}
                            onClick={() => updateData('yearsExperience', y.id)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${data.yearsExperience === y.id
                                ? 'bg-opeari-dark text-white border-opeari-dark'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {y.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Ages you're comfortable with <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map(g => (
                        <label key={g.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={data.ageGroups?.includes(g.id)}
                                onChange={() => toggleArrayItem('ageGroups', g.id)}
                                className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green"
                            />
                            <span className="text-sm text-gray-700">{g.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Certifications (Optional) */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Certifications (Optional)</label>
                <div className="flex flex-wrap gap-2">
                    {CERTS.map(c => (
                        <button
                            key={c.id}
                            onClick={() => toggleArrayItem('certifications', c.id)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${data.certifications?.includes(c.id)
                                ? 'bg-opeari-teal/10 text-opeari-teal border-opeari-teal'
                                : 'bg-white text-gray-500 border-gray-200'
                                }`}
                        >
                            {data.certifications?.includes(c.id) ? '✓ ' : '+ '}{c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bio */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Brief Bio <span className="text-red-500">*</span></label>
                <textarea
                    value={data.bio}
                    onChange={(e) => updateData('bio', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opeari-green focus:border-transparent min-h-[100px]"
                    placeholder="Tell families a bit about your style, hobbies, or why you love childcare..."
                />
            </div>
        </div>
    );
}
