
import PreferenceRow from './PreferenceRow';
import DayToggleList from './DayToggleList';
import SegmentedTimeControl from './SegmentedTimeControl';
import RadioCardGroup from './RadioCardGroup';
import SettingsCard from './SettingsCard';
import SettingsToggle from './SettingsToggle';
import {
    CARE_TYPES,
    AGE_GROUPS,
    BUDGET_TIERS,
    DAYS_OPTIONS,
    BLOCKS_OPTIONS,
    SPECIAL_OPTIONS
} from '../../lib/constants/careConstants';
import { Heart, Calendar, AlertCircle } from 'lucide-react';

interface FamilyNeedsPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function FamilyNeedsPanel({ formData, setFormData, saving, onSave }: FamilyNeedsPanelProps) {
    // Helper to toggle array items
    const toggleItem = (currentList: string[], item: string) => {
        if (currentList.includes(item)) {
            return currentList.filter(i => i !== item);
        } else {
            return [...currentList, item];
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-8 animate-fade-in max-w-3xl">

            {/* SECTION 1: CARE BASICS */}
            <SettingsCard title="Care Needed" description="What kind of help are you looking for?" icon={Heart}>
                <div className="space-y-4">
                    {CARE_TYPES.map(opt => (
                        <PreferenceRow
                            key={opt.value}
                            label={opt.label}
                            checked={(formData.care_types || []).includes(opt.value)}
                            onChange={() => setFormData({
                                ...formData,
                                care_types: toggleItem(formData.care_types || [], opt.value)
                            })}
                        />
                    ))}
                </div>
            </SettingsCard>

            <SettingsCard title="Age Groups" description="Ages of children requiring care.">
                <div className="space-y-4">
                    {AGE_GROUPS.map(opt => (
                        <PreferenceRow
                            key={opt.value}
                            label={opt.label}
                            checked={(formData.children_age_groups || []).includes(opt.value)}
                            onChange={() => setFormData({
                                ...formData,
                                children_age_groups: toggleItem(formData.children_age_groups || [], opt.value)
                            })}
                        />
                    ))}
                </div>
            </SettingsCard>

            <SettingsCard title="Budget Goal ($/hr)">
                <RadioCardGroup
                    label=""
                    options={BUDGET_TIERS}
                    selectedValue={formData.budget_tier || ''}
                    onChange={(val) => setFormData({ ...formData, budget_tier: val })}
                />
            </SettingsCard>

            {/* SECTION 2: AVAILABILITY */}
            <SettingsCard title="Availability" icon={Calendar}>
                <div className="space-y-8">
                    {/* Horizontal Day Toggles */}
                    <DayToggleList
                        label="Days Needed"
                        days={DAYS_OPTIONS}
                        selected={formData.availability_days || []}
                        onChange={(vals) => setFormData({ ...formData, availability_days: vals })}
                    />

                    {/* Segmented Time Blocks */}
                    <SegmentedTimeControl
                        label="Time of Day"
                        options={BLOCKS_OPTIONS}
                        selected={formData.availability_blocks || []}
                        onChange={(vals) => setFormData({ ...formData, availability_blocks: vals })}
                    />

                    <SettingsToggle
                        label="Flexible Schedule?"
                        description="I'm open to slightly different times."
                        checked={formData.schedule_flexible || false}
                        onChange={(val) => setFormData({ ...formData, schedule_flexible: val })}
                    />
                </div>
            </SettingsCard>

            {/* SECTION 3: REQUIREMENTS */}
            <SettingsCard title="Special Requirements" description="Specific needs or constraints." icon={AlertCircle}>
                <div className="space-y-4">
                    {SPECIAL_OPTIONS.map(opt => (
                        <PreferenceRow
                            key={opt.value}
                            label={opt.label}
                            checked={(formData.special_availability || []).includes(opt.value)}
                            onChange={() => setFormData({
                                ...formData,
                                special_availability: toggleItem(formData.special_availability || [], opt.value)
                            })}
                        />
                    ))}
                </div>
            </SettingsCard>

            <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-opeari-green text-white font-semibold rounded-[50px] hover:bg-opeari-green-dark disabled:opacity-50 shadow-button hover:shadow-button-hover transition-all"
                >
                    {saving ? 'Saving...' : 'Save Family Needs'}
                </button>
            </div>
        </form>
    );
}
