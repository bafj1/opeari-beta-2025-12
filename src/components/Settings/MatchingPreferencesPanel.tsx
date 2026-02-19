import { useState, useEffect, useCallback } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';
import { Link } from 'react-router-dom';

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const CARE_TYPE_OPTIONS = [
    { id: 'babysitter', label: 'Babysitter' },
    { id: 'nanny', label: 'Nanny' },
    { id: 'nanny-share', label: 'Nanny Share' },
    { id: 'mothers-helper', label: "Mother's Helper" },
    { id: 'backup-care', label: 'Backup Care' },
    { id: 'household-manager', label: 'Household Manager' },
    { id: 'special-needs', label: 'Special Needs Care' },
];

const AGE_RANGE_OPTIONS = [
    { id: 'infant', label: 'Infants (0-12 mo)' },
    { id: 'toddler', label: 'Toddlers (1-3)' },
    { id: 'preschool', label: 'Preschool (3-5)' },
    { id: 'school-age', label: 'School Age (5-12)' },
    { id: 'teen', label: 'Teens (13+)' },
];

const LANGUAGE_OPTIONS = [
    { id: 'english', label: 'English' },
    { id: 'spanish', label: 'Spanish' },
    { id: 'mandarin', label: 'Mandarin' },
    { id: 'french', label: 'French' },
    { id: 'arabic', label: 'Arabic' },
    { id: 'hindi', label: 'Hindi' },
    { id: 'portuguese', label: 'Portuguese' },
    { id: 'korean', label: 'Korean' },
];

interface MatchingPreferencesPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: (override?: any) => void;
}

export default function MatchingPreferencesPanel({ formData: _formData, setFormData: _setFormData }: MatchingPreferencesPanelProps) {
    const { viewer } = useViewer();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const [prefs, setPrefs] = useState({
        show_me: 'both' as string,
        care_types: [] as string[],
        age_ranges_need: [] as string[],
        languages: [] as string[],
        smoke_free_required: false,
        comfortable_with_pets: false,
        has_transportation: false,
        needs_caregiver_driver: false,
        max_travel_miles: 10,
        overnight_available: false,
    });

    // Load from viewer
    useEffect(() => {
        if (!viewer?.member) return;
        const saved = viewer.member.matching_prefs || {};
        setPrefs({
            show_me: saved.show_me || 'both',
            care_types: viewer.member.care_types || saved.care_types || [],
            age_ranges_need: saved.age_ranges_need || viewer.member.children_age_groups || [],
            languages: viewer.member.languages || saved.languages || [],
            smoke_free_required: viewer.member.smoke_free_required || false,
            comfortable_with_pets: viewer.member.comfortable_with_pets || false,
            has_transportation: viewer.member.has_transportation || false,
            needs_caregiver_driver: viewer.member.needs_caregiver_driver || false,
            max_travel_miles: viewer.member.max_travel_miles || 10,
            overnight_available: viewer.member.overnight_available || false,
        });
    }, [viewer?.member?.id]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce(async (data: Record<string, any>) => {
            if (!viewer?.user?.id) return;
            setSaveStatus('saving');
            try {
                const { error } = await supabase
                    .from('members')
                    .update({
                        matching_prefs: data,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', viewer.user.id);
                if (error) throw error;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Error saving preferences:', err);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }, 1000),
        [viewer?.user?.id]
    );

    const updatePref = (key: string, value: any) => {
        const updated = { ...prefs, [key]: value };
        setPrefs(updated);

        // Sync dedicated columns for fields used directly by the algorithm
        if (viewer?.user?.id) {
            const syncColumns: Record<string, string> = {
                care_types: 'care_types',
                languages: 'languages',
                smoke_free_required: 'smoke_free_required',
                comfortable_with_pets: 'comfortable_with_pets',
                has_transportation: 'has_transportation',
                needs_caregiver_driver: 'needs_caregiver_driver',
                max_travel_miles: 'max_travel_miles',
                overnight_available: 'overnight_available',
                can_lift_30lbs: 'can_lift_30lbs',
                comfortable_with_stairs: 'comfortable_with_stairs',
            };

            if (syncColumns[key]) {
                supabase.from('members')
                    .update({ [syncColumns[key]]: value })
                    .eq('id', viewer.user.id)
                    .then(({ error }) => {
                        if (error) console.error(`Error syncing ${key}:`, error);
                    });
            }
        }

        debouncedSave(updated);
    };

    const toggleArrayItem = (key: string, item: string) => {
        const current = (prefs as any)[key] || [];
        const updated = current.includes(item)
            ? current.filter((i: string) => i !== item)
            : [...current, item];
        updatePref(key, updated);
    };

    const Pill = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active
                ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                : 'bg-white text-[#546E5C] border-[#8bd7c7]/30 hover:border-[#8bd7c7]'
                }`}
        >
            {label}
        </button>
    );

    const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-sm font-semibold text-[#1e6b4e]">{label}</p>
                <p className="text-xs text-[#546E5C]">{desc}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ backgroundColor: checked ? '#1e6b4e' : '#d1d5db' }}
                role="switch"
                aria-checked={checked}
            >
                <div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all"
                    style={{ left: checked ? '22px' : '2px' }}
                />
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-3xl">

            {/* Auto-save indicator */}
            {saveStatus !== 'idle' && (
                <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all flex items-center gap-2 ${saveStatus === 'saving' ? 'bg-[#8bd7c7]/20 text-[#1e6b4e]' :
                    saveStatus === 'saved' ? 'bg-[#d8f5e5] text-[#1e6b4e]' :
                        'bg-red-50 text-red-600'
                    }`}>
                    {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>}
                    {saveStatus === 'saved' && <><Check className="w-3.5 h-3.5" /> Saved</>}
                    {saveStatus === 'error' && '✗ Error saving'}
                </div>
            )}

            {/* Header explanation */}
            <div className="bg-white rounded-2xl p-5 border border-[#8bd7c7]/20 shadow-sm">
                <h3 className="text-base font-bold text-[#1e6b4e] mb-1">Your Matching Preferences</h3>
                <p className="text-xs text-[#546E5C] leading-relaxed">
                    These preferences shape who appears in your Discover feed and how they&apos;re ranked.
                    Your <Link to="/settings?tab=schedule" className="text-[#1e6b4e] font-semibold underline">schedule availability</Link> is
                    the strongest matching signal — set it in Schedule &amp; Availability.
                </p>
            </div>

            {/* === 1. Show Me (filter, not scored) === */}
            <div className="bg-white rounded-2xl p-6 border border-[#8bd7c7]/20 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Search className="w-4 h-4 text-[#1e6b4e]" />
                    <h3 className="text-sm font-bold text-[#1e6b4e]">Show Me</h3>
                </div>
                <p className="text-xs text-[#546E5C] mb-4">Who should appear in your Discover feed?</p>

                <div className="flex gap-3">
                    {[
                        { id: 'parents', label: 'Parents', desc: 'Looking for care' },
                        { id: 'caregivers', label: 'Caregivers', desc: 'Providing care' },
                        { id: 'both', label: 'Both', desc: 'Everyone' },
                    ].map(opt => {
                        const active = prefs.show_me === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => updatePref('show_me', opt.id)}
                                className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${active
                                    ? 'border-[#1e6b4e] bg-[#d8f5e5]/30'
                                    : 'border-[#8bd7c7]/20 hover:border-[#8bd7c7]/50'
                                    }`}
                            >
                                <p className={`text-sm font-semibold ${active ? 'text-[#1e6b4e]' : 'text-[#546E5C]'}`}>
                                    {opt.label}
                                </p>
                                <p className="text-[10px] text-[#546E5C]">{opt.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* === 2. Care Types (20 pts) === */}
            <div className="bg-white rounded-2xl p-6 border border-[#8bd7c7]/20 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-[#1e6b4e]">Care Types</h3>
                    <span className="text-[10px] text-[#546E5C] bg-[#d8f5e5] px-2 py-0.5 rounded-full font-medium">High impact</span>
                </div>
                <p className="text-xs text-[#546E5C] mb-4">What kind of care are you looking for?</p>

                <div className="flex flex-wrap gap-2">
                    {CARE_TYPE_OPTIONS.map(ct => (
                        <Pill
                            key={ct.id}
                            active={(prefs.care_types || []).includes(ct.id)}
                            label={ct.label}
                            onClick={() => toggleArrayItem('care_types', ct.id)}
                        />
                    ))}
                </div>
            </div>

            {/* === 3. Age Ranges (15 pts) === */}
            <div className="bg-white rounded-2xl p-6 border border-[#8bd7c7]/20 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-[#1e6b4e]">Age Range</h3>
                    <span className="text-[10px] text-[#546E5C] bg-[#d8f5e5] px-2 py-0.5 rounded-full font-medium">High impact</span>
                </div>
                <p className="text-xs text-[#546E5C] mb-4">Match with families who have kids in similar age groups</p>

                <div className="flex flex-wrap gap-2">
                    {AGE_RANGE_OPTIONS.map(age => (
                        <Pill
                            key={age.id}
                            active={(prefs.age_ranges_need || []).includes(age.id)}
                            label={age.label}
                            onClick={() => toggleArrayItem('age_ranges_need', age.id)}
                        />
                    ))}
                </div>
            </div>

            {/* === 4. Languages (10 pts) === */}
            <div className="bg-white rounded-2xl p-6 border border-[#8bd7c7]/20 shadow-sm">
                <h3 className="text-sm font-bold text-[#1e6b4e] mb-1">Languages</h3>
                <p className="text-xs text-[#546E5C] mb-4">Prefer matches who speak these languages</p>

                <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                        <Pill
                            key={lang.id}
                            active={(prefs.languages || []).includes(lang.id)}
                            label={lang.label}
                            onClick={() => toggleArrayItem('languages', lang.id)}
                        />
                    ))}
                </div>
            </div>

            {/* === 5. Household Preferences (5 pts) === */}
            <div className="bg-white rounded-2xl p-6 border border-[#8bd7c7]/20 shadow-sm">
                <h3 className="text-sm font-bold text-[#1e6b4e] mb-3">Household Preferences</h3>

                <Toggle
                    checked={prefs.smoke_free_required}
                    onChange={(v) => updatePref('smoke_free_required', v)}
                    label="Smoke-free environment"
                    desc="Only match with non-smoking households"
                />
                <div className="border-t border-[#8bd7c7]/10 my-2" />
                <Toggle
                    checked={prefs.comfortable_with_pets}
                    onChange={(v) => updatePref('comfortable_with_pets', v)}
                    label="Comfortable with pets"
                    desc="I have pets or am okay with pet-friendly homes"
                />
            </div>

            {/* === 6. Practical Details (role-aware) === */}
            <div className="bg-white rounded-2xl p-6 border border-[#8bd7c7]/20 shadow-sm">
                <h3 className="text-sm font-bold text-[#1e6b4e] mb-3">Practical Details</h3>

                {/* Everyone sees transportation */}
                <Toggle
                    checked={prefs.has_transportation}
                    onChange={(v) => updatePref('has_transportation', v)}
                    label="I have my own transportation"
                    desc="I have a car or reliable way to get around"
                />

                <div className="border-t border-[#8bd7c7]/10 my-2" />

                {/* Family-specific: need caregiver to drive */}
                {viewer?.member?.role === 'family' && (
                    <>
                        <Toggle
                            checked={prefs.needs_caregiver_driver}
                            onChange={(v) => updatePref('needs_caregiver_driver', v)}
                            label="Caregiver must be able to drive"
                            desc="Need them to do school runs, errands, etc."
                        />
                        <div className="border-t border-[#8bd7c7]/10 my-2" />
                    </>
                )}

                {/* Caregiver-specific: travel distance + overnight */}
                {(viewer?.member?.role === 'caregiver' || viewer?.member?.role === 'both') && (
                    <>
                        <div className="py-2">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-semibold text-[#1e6b4e]">Maximum travel distance</p>
                                    <p className="text-xs text-[#546E5C]">How far are you willing to commute?</p>
                                </div>
                                <span className="text-sm font-bold text-[#1e6b4e]">
                                    {prefs.max_travel_miles || 10} miles
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={prefs.max_travel_miles || 10}
                                onChange={(e) => updatePref('max_travel_miles', parseInt(e.target.value))}
                                className="w-full h-2 bg-[#8bd7c7]/20 rounded-full appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1e6b4e] [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-[#546E5C] mt-1">
                                <span>1 mile</span>
                                <span>30 miles</span>
                            </div>
                        </div>
                        <div className="border-t border-[#8bd7c7]/10 my-2" />

                        <Toggle
                            checked={prefs.overnight_available}
                            onChange={(v) => updatePref('overnight_available', v)}
                            label="Available for overnight care"
                            desc="I can do evening/overnight sitting"
                        />
                    </>
                )}

                {/* Caregiver-specific: physical capabilities */}
                {(viewer?.member?.role === 'caregiver' || viewer?.member?.role === 'both') && (
                    <>
                        <div className="border-t border-[#8bd7c7]/10 my-2" />
                        <Toggle
                            checked={(prefs as any).can_lift_30lbs || false}
                            onChange={(v) => updatePref('can_lift_30lbs', v)}
                            label="Can lift 30+ lbs"
                            desc="Comfortable carrying toddlers, car seats, etc."
                        />
                        <div className="border-t border-[#8bd7c7]/10 my-2" />
                        <Toggle
                            checked={(prefs as any).comfortable_with_stairs || false}
                            onChange={(v) => updatePref('comfortable_with_stairs', v)}
                            label="Comfortable with stairs"
                            desc="No issues navigating multi-level homes"
                        />
                    </>
                )}
            </div>
        </div>
    );
}
