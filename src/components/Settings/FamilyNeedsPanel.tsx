import { useState } from 'react';
import ChipMultiSelect from '../common/ChipMultiSelect';
import {
    CARE_TYPES,
    AGE_GROUPS,
    BUDGET_TIERS,
    DAYS_OPTIONS,
    BLOCKS_OPTIONS,
    SPECIAL_OPTIONS
} from '../../lib/constants/careConstants';

interface FamilyNeedsPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function FamilyNeedsPanel({ formData, setFormData, saving, onSave }: FamilyNeedsPanelProps) {
    const [showDetailedSchedule, setShowDetailedSchedule] = useState(false);

    const inputClass = "w-full p-3.5 rounded-xl border border-opeari-border/50 bg-white text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-12 animate-fade-in max-w-3xl">

            {/* SECTION 1: CARE BASICS */}
            <section>
                <h3 className="text-xl font-bold text-opeari-heading mb-6 flex items-center gap-2">
                    Care Basics
                </h3>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-6 hover:border-opeari-green/20 transition-colors">
                    <ChipMultiSelect
                        label="Care Type Needed"
                        options={CARE_TYPES}
                        selected={formData.care_types}
                        onChange={(vals) => setFormData({ ...formData, care_types: vals })}
                    />
                    <div className="space-y-1">
                        <ChipMultiSelect
                            label="Age groups only (for now)"
                            options={AGE_GROUPS}
                            selected={formData.children_age_groups}
                            onChange={(vals) => setFormData({ ...formData, children_age_groups: vals })}
                        />
                        <p className="text-xs text-gray-400 font-medium px-1">
                            These tags help us match your care needs. You’ll be able to add kid details later.
                        </p>
                    </div>
                    <ChipMultiSelect
                        label="Budget per Hour"
                        options={BUDGET_TIERS}
                        selected={formData.budget_tiers}
                        onChange={(vals) => setFormData({ ...formData, budget_tiers: vals })}
                    />
                </div>
            </section>

            {/* SECTION 2: AVAILABILITY */}
            <section>
                <h3 className="text-xl font-bold text-opeari-heading mb-6 flex items-center gap-2">
                    Availability
                </h3>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-6 hover:border-opeari-green/20 transition-colors">
                    <ChipMultiSelect
                        label="Days Needed"
                        options={DAYS_OPTIONS}
                        selected={formData.availability_days}
                        onChange={(vals) => setFormData({ ...formData, availability_days: vals })}
                    />
                    <ChipMultiSelect
                        label="Time Blocks"
                        options={BLOCKS_OPTIONS}
                        selected={formData.availability_blocks}
                        onChange={(vals) => setFormData({ ...formData, availability_blocks: vals })}
                    />

                    <div className="pt-2">
                        <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                            <input
                                type="checkbox"
                                checked={formData.schedule_flexible || false}
                                onChange={(e) => setFormData({ ...formData, schedule_flexible: e.target.checked })}
                                className="w-5 h-5 mt-0.5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                            />
                            <div>
                                <span className="text-opeari-text font-bold text-sm block">My schedule is flexible</span>
                                <span className="text-xs text-gray-500 block mt-0.5">If your availability changes week to week, we’ll treat your schedule as flexible.</span>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 border-t border-gray-200/50">
                        <button
                            type="button"
                            onClick={() => setShowDetailedSchedule(!showDetailedSchedule)}
                            className="flex items-center gap-2 text-sm font-bold text-opeari-green hover:text-opeari-heading transition-colors"
                        >
                            {showDetailedSchedule ? 'Hide Detailed Schedule' : 'Show Detailed Schedule (Coming Soon)'}
                        </button>
                        {showDetailedSchedule && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                                Detailed recurring schedule grid is coming in the next update. For now, please use the Days and Blocks above.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION 3: REQUIREMENTS */}
            <section>
                <h3 className="text-xl font-bold text-opeari-heading mb-6 flex items-center gap-2">
                    Requirements
                </h3>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-6 hover:border-opeari-green/20 transition-colors">
                    <ChipMultiSelect
                        label="Special Requirements"
                        options={SPECIAL_OPTIONS}
                        selected={formData.special_availability}
                        onChange={(vals) => setFormData({ ...formData, special_availability: vals })}
                    />

                    <div className="pt-4 border-t border-gray-200/50 space-y-4">
                        <label className={labelClass}>Additional Requirements</label>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Language Preference</label>
                            <select
                                value={formData.language_requirement}
                                onChange={(e) => setFormData({ ...formData, language_requirement: e.target.value })}
                                className={inputClass}
                            >
                                <option value="nice_to_have">Nice to have</option>
                                <option value="must_have">Must have</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.transportation_required || false}
                                    onChange={(e) => setFormData({ ...formData, transportation_required: e.target.checked })}
                                    className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                                />
                                <span className="text-opeari-text font-medium">Transportation Required</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.require_identity_verified || false}
                                    onChange={(e) => setFormData({ ...formData, require_identity_verified: e.target.checked })}
                                    className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                                />
                                <span className="text-opeari-text font-medium">Require Identity Verified</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.require_background_verified || false}
                                    onChange={(e) => setFormData({ ...formData, require_background_verified: e.target.checked })}
                                    className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                                />
                                <span className="text-opeari-text font-medium">Require Background Check</span>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-10 py-3.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Details'}
                </button>
            </div>
        </form>
    );
}
