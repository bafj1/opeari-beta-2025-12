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

    // Fields
    const [yearsExperience, setYearsExperience] = useState<string>('');
    const [hourlyRateMin, setHourlyRateMin] = useState<string>('');
    const [hourlyRateMax, setHourlyRateMax] = useState<string>('');
    const [certifications, setCertifications] = useState<string[]>([]);
    const [education, setEducation] = useState<string>('');
    const [canLift, setCanLift] = useState(false);
    const [comfortableStairs, setComfortableStairs] = useState(false);

    useEffect(() => {
        if (!userId) return;

        async function loadProfile() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('caregiver_profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    console.warn('Caregiver profile load:', error.message);
                } else if (data) {
                    setYearsExperience(data.years_experience?.toString() || '');
                    setHourlyRateMin(data.hourly_rate_min?.toString() || data.hourly_rate?.toString() || '');
                    setHourlyRateMax(data.hourly_rate_max?.toString() || '');
                    setCertifications(data.certifications || []);
                    setEducation(data.education || '');
                }

                // Load physical capabilities from members table
                if (viewer?.member) {
                    setCanLift(viewer.member.can_lift_30lbs || false);
                    setComfortableStairs(viewer.member.comfortable_with_stairs || false);
                }
            } catch (err) {
                console.warn('Caregiver profile load failed:', err);
            }
            setLoading(false);
        }

        loadProfile();
    }, [userId]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        setSaved(false);

        // Build payload — only include fields that exist in the table
        const payload: Record<string, any> = {
            id: userId,
            years_experience: yearsExperience ? parseInt(yearsExperience) : null,
            certifications,
        };

        // Try to include education — column may not exist yet
        payload.education = education || null;

        if (hourlyRateMin) payload.hourly_rate_min = parseFloat(hourlyRateMin);
        if (hourlyRateMax) payload.hourly_rate_max = parseFloat(hourlyRateMax);

        const { error } = await supabase
            .from('caregiver_profiles')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            // If education column doesn't exist yet, retry without it
            if (error.message?.includes('education') || error.code === 'PGRST204') {
                console.warn('Education column not yet available, saving without it');
                delete payload.education;
                const { error: retryError } = await supabase
                    .from('caregiver_profiles')
                    .upsert(payload, { onConflict: 'id' });
                if (retryError) {
                    console.error('Failed to save caregiver profile:', retryError);
                } else {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                }
            } else {
                console.error('Failed to save caregiver profile:', error);
            }
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }

        // Save physical capabilities to members table
        await supabase.from('members').update({
            can_lift_30lbs: canLift,
            comfortable_with_stairs: comfortableStairs,
        }).eq('id', userId);

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
            <div className="animate-pulse space-y-4 mt-8 pt-8 border-t border-[#8bd7c7]/30">
                <div className="h-6 bg-gray-100 rounded w-48" />
                <div className="h-10 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-100 rounded w-full" />
            </div>
        );
    }

    return (
        <div className="mt-8 pt-8 border-t border-[#8bd7c7]/30">
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
                    className="w-full sm:w-48 px-4 py-2.5 border border-[#8bd7c7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm bg-white"
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
                            className="w-24 pl-7 pr-3 py-2.5 border border-[#8bd7c7]/30 rounded-xl text-sm text-[#1e6b4e] focus:border-[#1e6b4e] focus:ring-1 focus:ring-[#1e6b4e]/20 focus:outline-none"
                            aria-label="Minimum hourly rate"
                            min="0"
                            max="200"
                        />
                    </div>
                    <span className="text-sm text-[#546E5C]">to</span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546E5C] text-sm">$</span>
                        <input
                            type="number"
                            value={hourlyRateMax}
                            onChange={(e) => setHourlyRateMax(e.target.value)}
                            placeholder="40"
                            className="w-24 pl-7 pr-3 py-2.5 border border-[#8bd7c7]/30 rounded-xl text-sm text-[#1e6b4e] focus:border-[#1e6b4e] focus:ring-1 focus:ring-[#1e6b4e]/20 focus:outline-none"
                            aria-label="Maximum hourly rate"
                            min="0"
                            max="200"
                        />
                    </div>
                    <span className="text-sm text-[#546E5C]">/ hr</span>
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
                                : 'bg-white text-[#546E5C] border-[#8bd7c7]/30 hover:border-[#8bd7c7]'
                                }`}
                            aria-pressed={certifications.includes(cert)}
                            aria-label={`Certification: ${cert}`}
                        >
                            {cert}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-[#546E5C]/60 mt-2 italic">
                    Certifications are self-reported. Families can request verification during the connection process.
                </p>
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
                    className="w-full px-4 py-2.5 border border-[#8bd7c7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm"
                    aria-label="Education background"
                />
            </div>

            {/* Physical Capabilities */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">
                    Physical Capabilities
                </label>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#1e6b4e]">Can lift 30+ lbs</p>
                            <p className="text-xs text-[#546E5C]">Comfortable carrying toddlers, car seats, etc.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCanLift(!canLift)}
                            className="relative w-11 h-6 rounded-full transition-colors"
                            style={{ backgroundColor: canLift ? '#1e6b4e' : '#d1d5db' }}
                            role="switch"
                            aria-checked={canLift}
                        >
                            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all"
                                style={{ left: canLift ? '22px' : '2px' }} />
                        </button>
                    </div>

                    <div className="border-t border-[#8bd7c7]/10" />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#1e6b4e]">Comfortable with stairs</p>
                            <p className="text-xs text-[#546E5C]">Can navigate stairs, hills, multi-level homes</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setComfortableStairs(!comfortableStairs)}
                            className="relative w-11 h-6 rounded-full transition-colors"
                            style={{ backgroundColor: comfortableStairs ? '#1e6b4e' : '#d1d5db' }}
                            role="switch"
                            aria-checked={comfortableStairs}
                        >
                            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all"
                                style={{ left: comfortableStairs ? '22px' : '2px' }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-[50px] bg-[#1e6b4e] text-white font-semibold text-sm hover:bg-[#155a3e] transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
            >
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Caregiver Details'}
            </button>
        </div>
    );
}
