import PreferenceRow from './PreferenceRow';
import DayToggleList from './DayToggleList';
import SegmentedTimeControl from './SegmentedTimeControl';
import SettingsCard from './SettingsCard';
import { Briefcase, Calendar, GraduationCap } from 'lucide-react';

import {
    AGE_GROUPS,
    DAYS_OPTIONS,
    BLOCKS_OPTIONS
} from '../../lib/constants/careConstants';
import {
    ROLE_OPTIONS,
    LOGISTICS_OPTIONS,
    CERT_OPTIONS
} from '../../lib/constants/settingsConstants';

interface CaregiverExperiencePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function CaregiverExperiencePanel({ formData, setFormData, saving, onSave }: CaregiverExperiencePanelProps) {

    // Helper to toggle array items
    const toggleItem = (currentList: string[], item: string) => {
        if (currentList.includes(item)) {
            return currentList.filter(i => i !== item);
        } else {
            return [...currentList, item];
        }
    };

    const inputClass = "w-full p-3.5 rounded-xl border border-opeari-border/50 bg-white text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-8 animate-fade-in max-w-2xl">

            {/* SECTION 1: ROLE & EXPERIENCE */}
            <SettingsCard title="Role & Experience" icon={Briefcase}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Years Experience</label>
                            <select
                                value={formData.cg_years_experience}
                                onChange={(e) => setFormData({ ...formData, cg_years_experience: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">Select...</option>
                                <option value="0-1">0-1 Years (New)</option>
                                <option value="1-3">1-3 Years</option>
                                <option value="3-5">3-5 Years</option>
                                <option value="5-10">5-10 Years</option>
                                <option value="10+">10+ Years</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Hourly Rate ($/hr)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-bold">$</span>
                                </div>
                                <input
                                    type="number"
                                    value={formData.cg_hourly_rate}
                                    onChange={(e) => setFormData({ ...formData, cg_hourly_rate: e.target.value })}
                                    className={`${inputClass} pl-8`}
                                    placeholder="25"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-opeari-heading mb-3">Additional Roles</h4>
                        <div className="space-y-2">
                            {ROLE_OPTIONS.map(opt => (
                                <PreferenceRow
                                    key={opt.value}
                                    label={opt.label}
                                    checked={(formData.cg_secondary_roles || []).includes(opt.value)}
                                    onChange={() => setFormData({
                                        ...formData,
                                        cg_secondary_roles: toggleItem(formData.cg_secondary_roles || [], opt.value)
                                    })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* SECTION 2: AVAILABILITY */}
            <SettingsCard title="Availability" icon={Calendar}>
                <div className="space-y-8">
                    <DayToggleList
                        label="Days Available"
                        days={DAYS_OPTIONS}
                        selected={formData.cg_availability_days || []}
                        onChange={(vals) => setFormData({ ...formData, cg_availability_days: vals })}
                    />

                    <SegmentedTimeControl
                        label="Time Blocks"
                        options={BLOCKS_OPTIONS}
                        selected={formData.cg_availability_blocks || []}
                        onChange={(vals) => setFormData({ ...formData, cg_availability_blocks: vals })}
                    />
                </div>
            </SettingsCard>


            {/* SECTION 3: SKILLS */}
            <SettingsCard title="Skills & Certifications" icon={GraduationCap}>
                <div className="space-y-8">
                    <div>
                        <h4 className="font-semibold text-opeari-heading mb-3">Age Groups</h4>
                        <div className="space-y-2">
                            {AGE_GROUPS.map(opt => (
                                <PreferenceRow
                                    key={opt.value}
                                    label={opt.label}
                                    checked={(formData.cg_age_groups || []).includes(opt.value)}
                                    onChange={() => setFormData({
                                        ...formData,
                                        cg_age_groups: toggleItem(formData.cg_age_groups || [], opt.value)
                                    })}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-opeari-heading mb-3">Logistics & Skills</h4>
                        <div className="space-y-2">
                            {LOGISTICS_OPTIONS.map(opt => (
                                <PreferenceRow
                                    key={opt.value}
                                    label={opt.label}
                                    checked={(formData.cg_logistics || []).includes(opt.value)}
                                    onChange={() => setFormData({
                                        ...formData,
                                        cg_logistics: toggleItem(formData.cg_logistics || [], opt.value)
                                    })}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-opeari-heading mb-3">Certifications</h4>
                        <div className="space-y-2">
                            {CERT_OPTIONS.map(opt => (
                                <PreferenceRow
                                    key={opt.value}
                                    label={opt.label}
                                    checked={(formData.cg_certifications || []).includes(opt.value)}
                                    onChange={() => setFormData({
                                        ...formData,
                                        cg_certifications: toggleItem(formData.cg_certifications || [], opt.value)
                                    })}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Other Languages</label>
                        <input
                            type="text"
                            value={formData.cg_languages}
                            onChange={(e) => setFormData({ ...formData, cg_languages: e.target.value })}
                            placeholder="e.g. Spanish, French (English is assumed)"
                            className={inputClass}
                        />
                    </div>
                </div>
            </SettingsCard>

            <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-10 py-3.5 font-bold rounded-full transition-all bg-opeari-green text-white hover:bg-opeari-green-dark shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>

        </form>
    );
}
