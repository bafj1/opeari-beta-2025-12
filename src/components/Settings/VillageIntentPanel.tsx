
import ChipMultiSelect from '../common/ChipMultiSelect';
import { VILLAGE_SUPPORT_OPTIONS } from '../../lib/constants/careConstants';

interface VillageIntentPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function VillageIntentPanel({ formData, setFormData, saving, onSave }: VillageIntentPanelProps) {
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-10 animate-fade-in max-w-2xl">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-blue-900 text-sm font-medium flex gap-3">
                <span className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
                <p className="mt-0.5">Opeari is about give and take. Use this section for neighborly help (meal trains, carpools) rather than professional care.</p>
            </div>

            <div className="space-y-8">
                <ChipMultiSelect
                    label="Support I can OFFER"
                    options={VILLAGE_SUPPORT_OPTIONS}
                    selected={formData.support_offered}
                    onChange={(vals) => setFormData({ ...formData, support_offered: vals })}
                />

                <ChipMultiSelect
                    label="Support I NEED"
                    options={VILLAGE_SUPPORT_OPTIONS}
                    selected={formData.support_needed}
                    onChange={(vals) => setFormData({ ...formData, support_needed: vals })}
                />
            </div>

            <div>
                <label className={labelClass}>Additional Notes / Other Ideas</label>
                <textarea
                    value={formData.support_notes}
                    onChange={(e) => setFormData({ ...formData, support_notes: e.target.value })}
                    rows={4}
                    className="w-full p-3.5 rounded-xl border border-opeari-border/50 bg-white text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400"
                    placeholder="e.g. I work from home and can host playdates on Fridays..."
                />
            </div>

            <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-10 py-3.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Intent'}
                </button>
            </div>
        </form>
    );
}
