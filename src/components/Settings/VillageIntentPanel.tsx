import PreferenceRow from './PreferenceRow';
import NoteBanner from '../common/NoteBanner';
import SettingsCard from './SettingsCard';
import { VILLAGE_SUPPORT_OPTIONS } from '../../lib/constants/careConstants';
import { Users, HeartHandshake, HelpingHand } from 'lucide-react';

interface VillageIntentPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function VillageIntentPanel({ formData, setFormData, saving, onSave }: VillageIntentPanelProps) {

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
            <NoteBanner>
                Opeari is about give and take. Use this section for neighborly help (meal trains, carpools) rather than professional care.
            </NoteBanner>

            {/* Support Offered */}
            <SettingsCard title="Support I can OFFER" description="Ways you can help neighbors in your village." icon={HelpingHand}>
                <div className="space-y-4">
                    {VILLAGE_SUPPORT_OPTIONS.map(opt => (
                        <PreferenceRow
                            key={opt.value}
                            label={opt.label}
                            checked={(formData.support_offered || []).includes(opt.value)}
                            onChange={() => setFormData({
                                ...formData,
                                support_offered: toggleItem(formData.support_offered || [], opt.value)
                            })}
                        />
                    ))}
                </div>
            </SettingsCard>

            {/* Support Needed */}
            <SettingsCard title="Support I NEED" description="Ways neighbors can help you." icon={HeartHandshake}>
                <div className="space-y-4">
                    {VILLAGE_SUPPORT_OPTIONS.map(opt => (
                        <PreferenceRow
                            key={opt.value}
                            label={opt.label}
                            checked={(formData.support_needed || []).includes(opt.value)}
                            onChange={() => setFormData({
                                ...formData,
                                support_needed: toggleItem(formData.support_needed || [], opt.value)
                            })}
                        />
                    ))}
                </div>
            </SettingsCard>

            {/* Notes */}
            <SettingsCard title="Additional Notes / Other Ideas" icon={Users}>
                <textarea
                    value={formData.support_notes}
                    onChange={(e) => setFormData({ ...formData, support_notes: e.target.value })}
                    rows={4}
                    className="w-full p-4 rounded-[15px] border border-opeari-border/50 bg-stone-50 text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400"
                    placeholder="e.g. I work from home and can host playdates on Fridays..."
                />
            </SettingsCard>

            <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-opeari-green text-white font-semibold rounded-[50px] hover:bg-opeari-green-dark disabled:opacity-50 shadow-button hover:shadow-button-hover transition-all"
                >
                    {saving ? 'Saving...' : 'Save Village Intent'}
                </button>
            </div>
        </form>
    );
}
