
import ChipMultiSelect from '../common/ChipMultiSelect';
import {
    AGE_GROUPS,
    DAYS_OPTIONS,
    BLOCKS_OPTIONS,
} from '../../lib/constants/careConstants';
import {
    YEARS_OPTIONS,
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
    const inputClass = "w-full p-3.5 rounded-xl border border-opeari-border/50 bg-white text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-12 animate-fade-in max-w-3xl">

            {/* SECTION 1: ROLE & EXPERIENCE */}
            <section>
                <h3 className="text-xl font-bold text-opeari-heading mb-6 flex items-center gap-2">
                    Role & Experience
                </h3>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Primary Role</label>
                            <select
                                value={formData.cg_role_type}
                                onChange={(e) => setFormData({ ...formData, cg_role_type: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">Select Role</option>
                                {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Years Experience</label>
                            <select
                                value={formData.cg_years_experience}
                                onChange={(e) => setFormData({ ...formData, cg_years_experience: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">Select Experience</option>
                                {YEARS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <ChipMultiSelect
                        label="Secondary Roles"
                        options={ROLE_OPTIONS}
                        selected={formData.cg_secondary_roles}
                        onChange={(vals) => setFormData({ ...formData, cg_secondary_roles: vals })}
                    />

                    {/* HOURLY RATE */}
                    <div>
                        <label className={labelClass}>Hourly Rate ($/hr)</label>
                        <div className="flex items-center">
                            <span className="p-3.5 bg-gray-50 border border-r-0 border-opeari-border/50 rounded-l-xl text-gray-500 font-bold">$</span>
                            <input
                                type="text"
                                value={formData.cg_hourly_rate}
                                onChange={(e) => setFormData({ ...formData, cg_hourly_rate: e.target.value.replace(/[^0-9]/g, '') })}
                                placeholder="25"
                                className="w-full p-3.5 rounded-r-xl border border-opeari-border/50 text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: AVAILABILITY */}
            <section>
                <h3 className="text-xl font-bold text-opeari-heading mb-6 flex items-center gap-2">
                    Availability
                </h3>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <ChipMultiSelect
                        label="Availability Days"
                        options={DAYS_OPTIONS}
                        selected={formData.cg_availability_days}
                        onChange={(vals) => setFormData({ ...formData, cg_availability_days: vals })}
                    />
                    <ChipMultiSelect
                        label="Time Blocks"
                        options={BLOCKS_OPTIONS}
                        selected={formData.cg_availability_blocks}
                        onChange={(vals) => setFormData({ ...formData, cg_availability_blocks: vals })}
                    />
                </div>
            </section>

            {/* SECTION 3: SKILLS & CERTS */}
            <section>
                <h3 className="text-xl font-bold text-opeari-heading mb-6 flex items-center gap-2">
                    Skills & Certifications
                </h3>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <ChipMultiSelect
                        label="Age Groups Experience"
                        options={AGE_GROUPS}
                        selected={formData.cg_age_groups}
                        onChange={(vals) => setFormData({ ...formData, cg_age_groups: vals })}
                    />

                    <ChipMultiSelect
                        label="Logistics & Skills"
                        options={LOGISTICS_OPTIONS}
                        selected={formData.cg_logistics}
                        onChange={(vals) => setFormData({ ...formData, cg_logistics: vals })}
                    />

                    <ChipMultiSelect
                        label="Certifications"
                        options={CERT_OPTIONS}
                        selected={formData.cg_certifications}
                        onChange={(vals) => setFormData({ ...formData, cg_certifications: vals })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <label className={labelClass}>Transportation</label>
                            <select
                                value={formData.cg_transportation}
                                onChange={(e) => setFormData({ ...formData, cg_transportation: e.target.value })}
                                className={inputClass}
                            >
                                <option value="none">None</option>
                                <option value="own_car">Own Car</option>
                                <option value="public_transit">Public Transit</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Languages</label>
                            <input
                                type="text"
                                value={formData.cg_languages}
                                onChange={(e) => setFormData({ ...formData, cg_languages: e.target.value })}
                                placeholder="English, Spanish..."
                                className={inputClass}
                            />
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
