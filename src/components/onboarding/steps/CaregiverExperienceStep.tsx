import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader } from '../components/WizardUI';
// @ts-ignore
import { Baby, Gamepad2, Plane, Sparkles, Check, Car, Utensils, Dumbbell, PawPrint, Waves, Footprints, CigaretteOff, GraduationCap, Home, Users, Heart } from 'lucide-react';

interface CaregiverExperienceStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}



const YEARS = [
    { id: '0-1', label: '< 1 Year' },
    { id: '1-3', label: '1-3 Years' },
    { id: '3-5', label: '3-5 Years' },
    { id: '5-10', label: '5-10 Years' },
    { id: '10+', label: '10+ Years' }
];

const AGE_GROUPS = [
    { id: 'infant', label: 'Infant (0-1)' },
    { id: 'toddler', label: 'Toddler (1-3)' },
    { id: 'preschool', label: 'Preschool (3-5)' },
    { id: 'school_age', label: 'School Age (5-10)' },
    { id: 'teen', label: 'Pre-teen / Teen (10+)' }
];

const CERTS = [
    { id: 'cpr', label: 'CPR Certified' },
    { id: 'first_aid', label: 'First Aid' },
    { id: 'ece', label: 'Early Childhood Ed' },
    { id: 'driver', label: 'Safe Driver' }
];

const BIO_MAX = 300;

export default function CaregiverExperienceStep({ data, updateData }: CaregiverExperienceStepProps) {
    const toggleArrayItem = (field: 'ageGroups' | 'certifications' | 'logistics' | 'secondaryRoles', item: string) => {
        const current = data[field] || [];
        if (current.includes(item)) {
            updateData(field, current.filter(i => i !== item));
        } else {
            updateData(field, [...current, item]);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <div className="flex justify-between items-start">
                <StepHeader
                    title="Your Experience"
                    subtitle="Share your background with local families."
                />
                <span className="text-xs font-bold text-[#1e6b4e] bg-[#f0faf4] px-3 py-1 rounded-full uppercase tracking-wider">Step 2 of 4</span>
            </div>

            {/* Role Type */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">What is your primary role? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { id: 'nanny', label: 'Nanny', icon: Baby },
                        { id: 'babysitter', label: 'Babysitter', icon: Gamepad2 },
                        { id: 'parents_helper', label: "Parent's Helper", icon: Sparkles },
                        { id: 'household_manager', label: 'Household Manager', icon: Sparkles },
                        { id: 'ncs', label: 'Newborn Care Specialist', icon: Baby },
                        { id: 'tutor', label: 'Tutor / Educator', icon: Sparkles },
                        { id: 'au_pair_live_in', label: 'Live-in Au Pair', icon: Plane },
                        { id: 'travel_nanny', label: 'Travel Nanny', icon: Plane },
                        { id: 'other', label: 'Other', icon: Sparkles }
                    ].map(role => {
                        const Icon = role.icon;
                        const isSelected = data.caregiverRole === role.id;
                        return (
                            <button
                                key={role.id}
                                onClick={() => updateData('caregiverRole', role.id)}
                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${isSelected
                                    ? 'border-[#1e6b4e] bg-[#f0faf4] text-[#1e6b4e]'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                    }`}
                            >
                                <Icon size={20} className={isSelected ? 'text-[#1e6b4e]' : 'text-gray-400'} />
                                <span className="font-bold text-sm w-full">{role.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Other Input */}
                {data.caregiverRole === 'other' && (
                    <div className="mt-2 animate-fade-in">
                        <input
                            type="text"
                            placeholder="Please specify... *Will require verification"
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6b4e] focus:outline-none"
                            autoFocus
                        />
                    </div>
                )}

                <p className="text-xs text-gray-400 pt-0.5">Choose the role that best describes you. You can add more details later.</p>
            </div>

            {/* Secondary Roles */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Also available for: <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { id: 'babysitting', label: 'Babysitting', icon: Gamepad2 },
                        { id: 'tutoring', label: 'Tutoring', icon: Sparkles },
                        { id: 'household', label: 'Household Tasks', icon: Home },
                        { id: 'travel', label: 'Travel', icon: Plane },
                        { id: 'overnight', label: 'Overnight Care', icon: Sparkles },
                        { id: 'nanny_share', label: 'Nanny Share', icon: Users }
                    ].map(role => {
                        const isSelected = data.secondaryRoles?.includes(role.id);
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.id}
                                onClick={() => toggleArrayItem('secondaryRoles', role.id)}
                                className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all text-left ${isSelected ? 'border-[#1e6b4e] bg-[#f0faf4]' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#1e6b4e] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Icon size={16} />
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-[#1e6b4e]' : 'text-gray-700'}`}>{role.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Years Experience */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Years of Experience <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                    {YEARS.map(y => (
                        <button
                            key={y.id}
                            onClick={() => updateData('yearsExperience', y.id)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${data.yearsExperience === y.id
                                ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {y.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400">All experience levels are welcome.</p>
            </div>

            {/* Age Groups */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Ages you're comfortable with <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2.5">
                    {AGE_GROUPS.map(g => {
                        const isSelected = data.ageGroups?.includes(g.id);
                        return (
                            <button
                                key={g.id}
                                onClick={() => toggleArrayItem('ageGroups', g.id)}
                                className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all text-left ${isSelected ? 'border-[#1e6b4e] bg-[#f0faf4]' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#1e6b4e] border-[#1e6b4e]' : 'bg-white border-gray-300'}`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-[#1e6b4e]' : 'text-gray-700'}`}>{g.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Logistics & Skills */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                    Logistics & Skills <span className="text-gray-400 font-normal">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                        { id: 'driver_license', label: 'Clean driving record', icon: Car },
                        { id: 'car_seats', label: 'Comfortable with Car Seats', icon: Baby },
                        { id: 'own_car', label: 'Has reliable access to a car', icon: Car },
                        { id: 'errands', label: 'Errands & school pickups', icon: Car },
                        { id: 'cooking', label: 'Can Cook Basic Meals', icon: Utensils },
                        { id: 'lifting', label: 'Lift 25–30 lb child', icon: Dumbbell },
                        { id: 'multi_kid', label: 'Multi-kid care', icon: Users },
                        { id: 'pets', label: 'Comfortable with Pets', icon: PawPrint },
                        { id: 'swimming', label: 'Comfortable Swimming', icon: Waves },
                        { id: 'stroller_walks', label: 'Hills & stroller walks', icon: Footprints },
                        { id: 'stairs', label: 'Stairs (carrying ok)', icon: Footprints },
                        { id: 'non_smoker', label: 'Non-Smoker', icon: CigaretteOff },
                        { id: 'homework', label: 'Homework Help', icon: GraduationCap },
                        { id: 'housekeeping', label: 'Light Housekeeping', icon: Home },
                        { id: 'nanny_share', label: 'Open to nanny share', icon: Users }
                    ].map(item => {
                        const isSelected = data.logistics?.includes(item.id);
                        // Safe icon check or default
                        const Icon = item.icon || Sparkles;
                        return (
                            <button
                                key={item.id}
                                onClick={() => toggleArrayItem('logistics', item.id)}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-3 ${isSelected
                                    ? 'bg-[#d8f5e5] text-[#1e6b4e] border-[#1e6b4e] shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#1e6b4e] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Icon size={16} />
                                </div>
                                <span className={isSelected ? 'font-bold' : ''}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Certifications (Optional) */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                    Certifications <span className="text-gray-400 font-normal">(Optional)</span>
                    <p className="text-xs text-gray-400 font-normal mt-0.5">You may be asked to provide documentation for verified status.</p>
                </label>
                <div className="flex flex-wrap gap-2">
                    {CERTS.map(c => {
                        const isSelected = data.certifications?.includes(c.id);
                        return (
                            <button
                                key={c.id}
                                onClick={() => toggleArrayItem('certifications', c.id)}
                                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                                    ? 'bg-[#1e6b4e] text-white border-[#1e6b4e] shadow-sm'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                {isSelected ? <Check size={14} /> : <Heart size={14} className="opacity-50" />}
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Brief Bio <span className="text-red-500">*</span></label>
                <div className="relative">
                    <textarea
                        value={data.bio}
                        onChange={(e) => {
                            if (e.target.value.length <= BIO_MAX) {
                                updateData('bio', e.target.value);
                            }
                        }}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opeari-green focus:border-transparent min-h-[100px] text-sm"
                        placeholder="Tell families a bit about your style, hobbies, or why you love childcare..."
                    />
                    <div className={`absolute bottom-3 right-3 text-xs font-medium ${data.bio && data.bio.length > BIO_MAX * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {data.bio?.length || 0}/{BIO_MAX}
                    </div>
                </div>
            </div>

            {/* Preferred Hourly Rate */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Preferred Hourly Rate</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#1e6b4e] focus-within:border-transparent bg-white">
                    <span className="text-gray-500 font-bold mr-2 pointer-events-none">$</span>
                    <input
                        type="text"
                        value={data.hourlyRate || ''}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateData('hourlyRate', val);
                        }}
                        placeholder="25"
                        className="flex-1 outline-none border-none bg-transparent p-0 m-0 focus:ring-0 font-bold text-lg text-gray-800 placeholder:font-normal placeholder:text-gray-300"
                    />
                    <span className="text-gray-400 text-xs ml-2 pointer-events-none">/hr</span>
                </div>
                <p className="text-xs text-gray-400">This helps match you with families within your range.</p>
            </div>
        </div>
    );
}
