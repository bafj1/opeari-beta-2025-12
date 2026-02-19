import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';

const certificationOptions = [
    'CPR / First Aid',
    'Early Childhood Education',
    'Child Development Associate (CDA)',
    'Special Needs Training',
    'Newborn Care Specialist',
    'Sleep Training',
    'Water Safety / Lifeguard',
    'Montessori',
    'RIE',
];

export default function CaregiverProfileSection() {
    const { viewer } = useViewer();
    const userId = viewer?.member?.id;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Fields — adapt to actual schema
    const [yearsExperience, setYearsExperience] = useState<string>('');
    const [hourlyRateMin, setHourlyRateMin] = useState<string>('');
    const [hourlyRateMax, setHourlyRateMax] = useState<string>('');
    const [certifications, setCertifications] = useState<string[]>([]);
    const [education, setEducation] = useState<string>('');

    useEffect(() => {
        if (!userId) return;

        async function loadProfile() {
            setLoading(true);
            const { data } = await supabase
                .from('caregiver_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setYearsExperience(data.years_experience?.toString() || '');
                // Adapt these to actual column names:
                setHourlyRateMin(data.hourly_rate_min?.toString() || data.hourly_rate?.toString() || '');
                setHourlyRateMax(data.hourly_rate_max?.toString() || '');
                setCertifications(data.certifications || []);
                setEducation(data.education || '');
            }
            setLoading(false);
        }

        loadProfile();
    }, [userId]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        setSaved(false);

        const payload: Record<string, any> = {
            id: userId,
            years_experience: yearsExperience ? parseInt(yearsExperience) : null,
            certifications,
            education: education || null,
        };

        // Adapt rate fields to actual schema
        if (hourlyRateMin) payload.hourly_rate_min = parseFloat(hourlyRateMin);
        if (hourlyRateMax) payload.hourly_rate_max = parseFloat(hourlyRateMax);

        const { error } = await supabase
            .from('caregiver_profiles')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            console.error('Failed to save caregiver profile:', error);
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }

        setSaving(false);
    };

    const toggleCertification = (cert: string) => {
        setCertifications(prev =>
            prev.includes(cert)
                ? prev.filter(c => c !== cert)
                : [...prev, cert]
        );
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4 mt-8 pt-8 border-t border-gray-200">
                <div className="h-6 bg-gray-100 rounded w-48" />
                <div className="h-10 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-100 rounded w-full" />
            </div>
        );
    }

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-[#1e6b4e] mb-1">Caregiver Details</h2>
            <p className="text-sm text-[#546E5C] mb-6">
                Help families learn more about your experience and qualifications.
            </p>

            {/* Years of Experience */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#1e6b4e] uppercase tracking-wide mb-2">
                    Years of Experience
                </label>
                <select
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm bg-white"
                    aria-label="Years of childcare experience"
                >
                    <option value="">Select...</option>
                    <option value="1">Less than 1 year</option>
                    <option value="2">1-2 years</option>
                    <option value="3">3-5 years</option>
                    <option value="7">5-10 years</option>
                    <option value="10">10+ years</option>
                </select>
            </div>

            {/* Hourly Rate Range */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#1e6b4e] uppercase tracking-wide mb-2">
                    Hourly Rate Range
                </label>
                <p className="text-xs text-[#546E5C] mb-2">
                    This helps families understand your expectations. You can always negotiate.
                </p>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546E5C] text-sm">$</span>
                        <input
                            type="number"
                            value={hourlyRateMin}
                            onChange={(e) => setHourlyRateMin(e.target.value)}
                            placeholder="20"
                            className="w-24 pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm"
                            aria-label="Minimum hourly rate"
                            min="0"
                            max="200"
                        />
                    </div>
                    <span className="text-[#546E5C] text-sm">to</span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546E5C] text-sm">$</span>
                        <input
                            type="number"
                            value={hourlyRateMax}
                            onChange={(e) => setHourlyRateMax(e.target.value)}
                            placeholder="35"
                            className="w-24 pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm"
                            aria-label="Maximum hourly rate"
                            min="0"
                            max="200"
                        />
                    </div>
                    <span className="text-xs text-[#546E5C]">/ hr</span>
                </div>
            </div>

            {/* Certifications */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#1e6b4e] uppercase tracking-wide mb-2">
                    Certifications & Training
                </label>
                <p className="text-xs text-[#546E5C] mb-3">
                    Select all that apply. These appear as badges on your profile.
                </p>
                <div className="flex flex-wrap gap-2">
                    {certificationOptions.map(cert => (
                        <button
                            key={cert}
                            type="button"
                            onClick={() => toggleCertification(cert)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${certifications.includes(cert)
                                ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                : 'bg-white text-[#546E5C] border-gray-200 hover:border-[#8bd7c7]'
                                }`}
                            aria-pressed={certifications.includes(cert)}
                            aria-label={`Certification: ${cert}`}
                        >
                            {cert}
                        </button>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#1e6b4e] uppercase tracking-wide mb-2">
                    Education
                </label>
                <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g., B.A. in Early Childhood Education"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm"
                    aria-label="Education background"
                />
            </div>

            {/* Save Button */}
            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-[50px] bg-[#1e6b4e] text-white font-semibold text-sm hover:bg-[#155a3e] transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
            >
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save Caregiver Details'}
            </button>
        </div>
    );
}
