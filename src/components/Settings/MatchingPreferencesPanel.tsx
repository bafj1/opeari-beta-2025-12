import { useState, useEffect } from 'react';
import {
    Search,
    MapPin,
    Clock,
    Users,
    Ban,
    Eye,
    Star,
    Award,
    Globe
} from 'lucide-react';
import SettingsCard from './SettingsCard';
import { useViewer } from '../../hooks/useViewer';


type MatchingPrefs = {
    max_distance: number;
    min_schedule_overlap: number;
    show_me: 'parents' | 'caregivers' | 'both';
    care_types: string[]; // Added Phase 9

    age_ranges_provide: string[];
    age_ranges_need: string[];
    dealbreakers: {
        background_check: boolean;
        smoke_free: boolean;
        pet_free: boolean;
        transportation: boolean;
        min_experience: boolean;
    };
    certifications: string[];
    nice_to_have: string[];
    languages: string[];
    discovery: {
        mutual_only: boolean;
        verified_only: boolean;
        active_recently: boolean;
        same_neighborhood: boolean;
    };
};

interface MatchingPreferencesPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: (override?: any) => void;
}

const AGE_GROUPS = [
    { id: 'infants', label: 'Infants (0-12 months)' },
    { id: 'toddlers', label: 'Toddlers (1-3 years)' },
    { id: 'preschool', label: 'Preschool (3-5 years)' },
    { id: 'school_age', label: 'School Age (5-12 years)' },
    { id: 'teens', label: 'Teens (13+ years)' },
];

const CERTIFICATIONS = [
    { id: 'cpr', label: 'CPR Certified' },
    { id: 'first_aid', label: 'First Aid' },
    { id: 'early_childhood', label: 'Early Childhood Education' },
    { id: 'special_needs', label: 'Special Needs Training' },
    { id: 'newborn', label: 'Newborn Care Specialist' },
];

const NICE_TO_HAVE = [
    { id: 'bilingual', label: 'Bilingual/Multilingual' },
    { id: 'references', label: 'Has References' },
    { id: 'college', label: 'College Degree' },
    { id: 'infant_exp', label: '3+ Years Infant Experience' },
    { id: 'meal_prep', label: 'Meal Preparation Skills' },
    { id: 'homework', label: 'Can Help with Homework' },
    { id: 'driver', label: 'Licensed Driver' },
    { id: 'pets', label: 'Comfortable with Pets' },
];

const LANGUAGES = [
    'English', 'Spanish', 'Mandarin', 'French', 'German', 'Italian', 'Arabic', 'Hindi'
];

export default function MatchingPreferencesPanel({ formData, setFormData, saving, onSave }: MatchingPreferencesPanelProps) {
    const { viewer } = useViewer();
    const userRole = viewer?.member?.role || 'family';
    const isCaregiver = userRole === 'caregiver';
    // const isParent = userRole === 'parent' || userRole === 'family'; // Not strictly needed if we just use !isCaregiver
    // Initialize from formData or defaults
    const [prefs, setPrefs] = useState<MatchingPrefs>(() => {
        const saved = (formData?.matching_prefs || {}) as Partial<MatchingPrefs>;
        return {
            max_distance: saved.max_distance ?? 10,
            min_schedule_overlap: saved.min_schedule_overlap ?? 50,
            show_me: saved.show_me ?? 'both',
            care_types: (formData?.care_types || []) as string[], // Initialize from root formData

            age_ranges_provide: saved.age_ranges_provide ?? [],
            age_ranges_need: saved.age_ranges_need ?? [],
            dealbreakers: {
                background_check: saved.dealbreakers?.background_check ?? false,
                smoke_free: saved.dealbreakers?.smoke_free ?? false,
                pet_free: saved.dealbreakers?.pet_free ?? false,
                transportation: saved.dealbreakers?.transportation ?? false,
                min_experience: saved.dealbreakers?.min_experience ?? false,
            },
            certifications: saved.certifications ?? [],
            nice_to_have: saved.nice_to_have ?? [],
            languages: saved.languages ?? ['English'],
            discovery: {
                mutual_only: saved.discovery?.mutual_only ?? false,
                verified_only: saved.discovery?.verified_only ?? false,
                active_recently: saved.discovery?.active_recently ?? false,
                same_neighborhood: saved.discovery?.same_neighborhood ?? false,
            },
        };
    });

    const [dirty, setDirty] = useState(false);

    // One guarded rehydrate effect
    useEffect(() => {
        const incoming = formData?.matching_prefs;
        if (!dirty && incoming && Object.keys(incoming).length > 0) {
            // rehydrate once if data arrives after mount
            setPrefs((prev) => ({
                ...prev,
                ...incoming,
                dealbreakers: { ...prev.dealbreakers, ...incoming.dealbreakers },
                discovery: { ...prev.discovery, ...incoming.discovery },
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData?.matching_prefs]);

    const updatePrefs = (updater: (prev: MatchingPrefs) => MatchingPrefs) => {
        setDirty(true);
        setPrefs((prev) => {
            const next = updater(prev);
            return next;
        });
    };

    const updatePref = (key: keyof MatchingPrefs, value: any) => {
        updatePrefs((prev) => ({ ...prev, [key]: value } as MatchingPrefs));
    };

    const updateDealbreaker = (key: keyof MatchingPrefs['dealbreakers'], value: boolean) => {
        updatePrefs((prev) => ({
            ...prev,
            dealbreakers: { ...prev.dealbreakers, [key]: value },
        }));
    };

    const updateDiscovery = (key: keyof MatchingPrefs['discovery'], value: boolean) => {
        updatePrefs((prev) => ({
            ...prev,
            discovery: { ...prev.discovery, [key]: value },
        }));
    };

    const toggleArrayItem = (
        key: 'certifications' | 'nice_to_have' | 'languages' | 'age_ranges_provide' | 'age_ranges_need',
        item: string
    ) => {
        updatePrefs((prev) => {
            const current = prev[key] || [];
            const updated = current.includes(item)
                ? current.filter((i) => i !== item)
                : [...current, item];
            return { ...prev, [key]: updated };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedFormData = {
            ...formData,
            matching_prefs: prefs,
            care_types: prefs.care_types, // Lift to root for DB compatibility

        };
        setFormData(updatedFormData);
        onSave(updatedFormData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-8 max-w-3xl">

            {/* What I Can Offer (New Phase 9) */}
            {!isCaregiver && (
                <SettingsCard title="What I Can Offer My Village" description="Ways you can help other families in your neighborhood" icon={Users}>
                    <div className="flex flex-wrap gap-2">
                        {[
                            'Emergency backup care',
                            'Playdate hosting',
                            'School pickup/dropoff',
                            'Weekend care',
                            'Meal sharing',
                            'Carpool',
                            'Homework help',
                            'Nanny share partner',
                        ].map(item => {
                            const current = formData.support_offered || [];
                            const isSelected = current.includes(item);
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        const updated = isSelected
                                            ? current.filter((s: string) => s !== item)
                                            : [...current, item];
                                        setFormData({ ...formData, support_offered: updated });
                                    }}
                                    className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${isSelected
                                        ? 'border-[#1e6b4e] bg-[#8bd7c7]/30 text-[#1e6b4e]'
                                        : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                        }`}
                                >
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                </SettingsCard>
            )}

            {/* Search Filters */}
            <SettingsCard title="Search Filters" description="Control who appears in your matches" icon={Search}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(139,215,199,0.15)',
                    marginBottom: '12px',
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E6B4E' }}>Saved for when matching launches</span>
                </div>
                {/* Maximum Distance */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#1e6b4e]">
                            <MapPin className="w-4 h-4" />
                            Maximum Distance
                        </label>
                        <span className="text-sm font-bold text-[#1e6b4e]">{prefs.max_distance} miles</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={prefs.max_distance}
                        onChange={(e) => updatePref('max_distance', Number(e.target.value))}
                        className="w-full h-2 bg-[#8bd7c7]/30 rounded-full appearance-none cursor-pointer accent-[#1e6b4e]"
                    />
                    <div className="flex justify-between text-xs text-[#546E5C] mt-1">
                        <span>1 mile</span>
                        <span>50 miles</span>
                    </div>
                </div>

                {/* Minimum Schedule Match */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#1e6b4e]">
                            <Clock className="w-4 h-4" />
                            Minimum Schedule Match
                        </label>
                        <span className="text-sm font-bold text-[#1e6b4e]">{prefs.min_schedule_overlap}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={prefs.min_schedule_overlap}
                        onChange={(e) => updatePref('min_schedule_overlap', Number(e.target.value))}
                        className="w-full h-2 bg-[#8bd7c7]/30 rounded-full appearance-none cursor-pointer accent-[#1e6b4e]"
                    />
                    <div className="flex justify-between text-xs text-[#546E5C] mt-1">
                        <span>0% overlap</span>
                        <span>100% overlap</span>
                    </div>
                </div>
            </SettingsCard>

            {/* Show Me - NEW from Figma */}
            <SettingsCard title="Show Me" description="Who do you want to see in your matches?" icon={Users}>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'parents', label: 'Parents Only', desc: 'Looking for care' },
                        { id: 'caregivers', label: 'Caregivers Only', desc: 'Providing care' },
                        { id: 'both', label: 'Both', desc: 'All members' },
                    ].map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => updatePref('show_me', option.id as any)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${prefs.show_me === option.id
                                ? 'border-[#1e6b4e] bg-[#8bd7c7]/20'
                                : 'border-[#8bd7c7]/30 hover:border-[#8bd7c7]'
                                }`}
                        >
                            <p className={`font-semibold text-sm ${prefs.show_me === option.id ? 'text-[#1e6b4e]' : 'text-[#1e6b4e]'}`}>
                                {option.label}
                            </p>
                            <p className="text-xs text-[#546E5C] mt-1">{option.desc}</p>
                        </button>
                    ))}
                </div>
            </SettingsCard>

            {/* Care Types - NEW Phase 9 (Hide for Caregivers as they have Family Preferences) */}
            {!isCaregiver && (
                <SettingsCard title="Care Types" description="What kind of care are you interested in?" icon={Users}>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'babysitter', label: 'Babysitter' },
                            { id: 'nanny', label: 'Nanny' },
                            { id: 'mothers-helper', label: 'Mother\'s Helper' },
                            { id: 'household-manager', label: 'Household Manager' },
                            { id: 'special-needs', label: 'Special Needs Care' },
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => {
                                    updatePrefs((prev) => {
                                        const current = prev.care_types || [];
                                        const updated = current.includes(type.id)
                                            ? current.filter((t) => t !== type.id)
                                            : [...current, type.id];
                                        return { ...prev, care_types: updated };
                                    });
                                }}
                                className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${(prefs.care_types || []).includes(type.id)
                                    ? 'border-[#1e6b4e] bg-[#8bd7c7]/30 text-[#1e6b4e]'
                                    : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </SettingsCard>
            )}

            {/* Age Range Preferences - NEW from Figma */}
            <SettingsCard title="Age Range Preferences" description="Select age ranges you're comfortable with" icon={Users}>
                {/* I can provide care for */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-[#1e6b4e] mb-3">
                        {isCaregiver ? 'Age groups you work with:' : 'I can provide care for:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {AGE_GROUPS.map((age) => (
                            <button
                                key={age.id}
                                type="button"
                                onClick={() => toggleArrayItem('age_ranges_provide', age.id)}
                                className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${(prefs.age_ranges_provide || []).includes(age.id)
                                    ? 'border-[#1e6b4e] bg-[#8bd7c7]/20 text-[#1e6b4e]'
                                    : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                    }`}
                            >
                                {age.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* I need care for */}
                {!isCaregiver && (
                    <div>
                        <p className="text-sm font-semibold text-[#1e6b4e] mb-3">I need care for:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {AGE_GROUPS.map((age) => (
                                <button
                                    key={age.id}
                                    type="button"
                                    onClick={() => toggleArrayItem('age_ranges_need', age.id)}
                                    className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${(prefs.age_ranges_need || []).includes(age.id)
                                        ? 'border-[#1e6b4e] bg-[#8bd7c7]/20 text-[#1e6b4e]'
                                        : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                        }`}
                                >
                                    {age.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </SettingsCard>

            {/* Family Preferences (Caregiver Only) */}
            {isCaregiver && (
                <SettingsCard title="Family Preferences" description="What kind of families are you looking to work with?" icon={Users}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-[#1e6b4e] mb-3">Preferred care arrangements:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'full-time', label: 'Full-time position' },
                                    { id: 'part-time', label: 'Part-time position' },
                                    { id: 'nanny-share', label: 'Nanny share' },
                                    { id: 'backup-care', label: 'Backup / On-call' },
                                    { id: 'occasional', label: 'Occasional / Date night' },
                                    { id: 'after-school', label: 'After school care' },
                                    { id: 'summer', label: 'Summer care' },
                                ].map(item => {
                                    const current = prefs.care_types || [];
                                    const isSelected = current.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                updatePrefs(prev => {
                                                    const currentTypes = prev.care_types || [];
                                                    const updated = isSelected
                                                        ? currentTypes.filter(t => t !== item.id)
                                                        : [...currentTypes, item.id];
                                                    return { ...prev, care_types: updated };
                                                });
                                            }}
                                            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${isSelected
                                                ? 'border-[#1e6b4e] bg-[#8bd7c7]/30 text-[#1e6b4e]'
                                                : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#1e6b4e] mb-3">Preferred number of children:</p>
                            <div className="flex flex-wrap gap-2">
                                {['1 child', '2 children', '3+ children', 'No preference'].map(option => {
                                    const current = (formData.matching_prefs?.preferred_num_kids) || 'No preference';
                                    const isSelected = current === option;
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => updatePref('preferred_num_kids' as any, option)}
                                            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${isSelected
                                                ? 'border-[#1e6b4e] bg-[#8bd7c7]/30 text-[#1e6b4e]'
                                                : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </SettingsCard>
            )}

            {/* Deal Breakers */}
            {!isCaregiver && (
                <SettingsCard title="Deal Breakers" description="These requirements must be met for matches to appear" icon={Ban}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(139,215,199,0.15)',
                        marginBottom: '12px',
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E6B4E' }}>Saved for when matching launches</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { key: 'background_check', label: 'Background Check Required', desc: 'Only show verified caregivers with background checks' },
                            { key: 'smoke_free', label: 'Smoke-Free Environment', desc: 'No smoking in home or around children' },
                            { key: 'pet_free', label: 'No Pets Required', desc: 'Must be pet-free household' },
                            { key: 'transportation', label: 'Own Transportation Required', desc: 'Must have reliable vehicle and valid license' },
                            { key: 'min_experience', label: 'Minimum Experience Required', desc: 'At least 2 years of childcare experience' },
                        ].map(item => (
                            <div key={item.key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                border: '1px solid rgba(139,215,199,0.2)',
                                borderRadius: '16px',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E6B4E', margin: 0 }}>{item.label}</p>
                                    <p style={{ fontSize: '12px', color: '#546E5C', marginTop: '2px' }}>{item.desc}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateDealbreaker(item.key as any, !(prefs.dealbreakers?.[item.key as keyof typeof prefs.dealbreakers] ?? false))}
                                    style={{
                                        position: 'relative',
                                        width: '44px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: (prefs.dealbreakers?.[item.key as keyof typeof prefs.dealbreakers] ?? false) ? '#1E6B4E' : 'rgba(139,215,199,0.4)',
                                        transition: 'background-color 0.2s',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: (prefs.dealbreakers?.[item.key as keyof typeof prefs.dealbreakers] ?? false) ? '22px' : '2px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        transition: 'left 0.2s',
                                    }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </SettingsCard>
            )}

            {/* Required Certifications - NEW from Figma */}
            {!isCaregiver && (
                <SettingsCard title="Required Certifications" description="Caregivers must have these certifications to match with you" icon={Award}>
                    <div className="grid grid-cols-2 gap-2">
                        {CERTIFICATIONS.map((cert) => (
                            <button
                                key={cert.id}
                                type="button"
                                onClick={() => toggleArrayItem('certifications', cert.id)}
                                className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${(prefs.certifications || []).includes(cert.id)
                                    ? 'border-[#1e6b4e] bg-[#8bd7c7]/20 text-[#1e6b4e]'
                                    : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                    }`}
                            >
                                {cert.label}
                            </button>
                        ))}
                    </div>
                </SettingsCard>
            )}

            {/* Nice to Have - NEW from Figma */}
            {!isCaregiver && (
                <SettingsCard title="Nice to Have" description="Preferred qualities that boost match scores but aren't required" icon={Star}>
                    <div className="flex flex-wrap gap-2">
                        {NICE_TO_HAVE.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleArrayItem('nice_to_have', item.id)}
                                className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${(prefs.nice_to_have || []).includes(item.id)
                                    ? 'border-[#1e6b4e] bg-[#8bd7c7]/30 text-[#1e6b4e]'
                                    : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </SettingsCard>
            )}

            {/* Language Preferences - NEW from Figma */}
            <SettingsCard title="Language Preferences" description="Select languages you prefer or require" icon={Globe}>
                <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => toggleArrayItem('languages', lang)}
                            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${(prefs.languages || []).includes(lang)
                                ? 'border-[#1e6b4e] bg-[#8bd7c7]/30 text-[#1e6b4e]'
                                : 'border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]'
                                }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </SettingsCard>

            {/* Discovery Settings */}
            <SettingsCard title="Discovery Settings" description="Fine-tune how you discover potential matches" icon={Eye}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(139,215,199,0.15)',
                    marginBottom: '12px',
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E6B4E' }}>Saved for when matching launches</span>
                </div>
                <div className="space-y-3">
                    {[
                        { key: 'mutual_only', label: 'Only show mutual connections', desc: 'Only match with people in your village or friends of friends' },
                        { key: 'verified_only', label: 'Verified profiles only', desc: 'Only show users with verified email and phone' },
                        { key: 'active_recently', label: 'Active in last 7 days', desc: 'Prioritize recently active members' },
                        { key: 'same_neighborhood', label: 'Within my neighborhood', desc: 'Focus on matches in the same ZIP code area' },
                    ].map(item => (
                        <div key={item.key} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            border: '1px solid rgba(139,215,199,0.2)',
                            borderRadius: '16px',
                        }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E6B4E', margin: 0 }}>{item.label}</p>
                                <p style={{ fontSize: '12px', color: '#546E5C', marginTop: '2px' }}>{item.desc}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateDiscovery(item.key as any, !(prefs.discovery?.[item.key as keyof typeof prefs.discovery] ?? false))}
                                style={{
                                    position: 'relative',
                                    width: '44px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: (prefs.discovery?.[item.key as keyof typeof prefs.discovery] ?? false) ? '#1E6B4E' : 'rgba(139,215,199,0.4)',
                                    transition: 'background-color 0.2s',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: (prefs.discovery?.[item.key as keyof typeof prefs.discovery] ?? false) ? '22px' : '2px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    transition: 'left 0.2s',
                                }} />
                            </button>
                        </div>
                    ))}
                </div>
            </SettingsCard>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    className="px-8 py-3 border-2 border-[#8bd7c7] text-[#1e6b4e] font-semibold rounded-[50px] hover:bg-[#8bd7c7]/20 transition-colors"
                >
                    Reset to Defaults
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-[#1e6b4e] hover:bg-[#155a3e] text-white font-semibold rounded-[50px] disabled:opacity-50 transition-colors shadow-sm"
                >
                    {saving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </form>
    );
}
