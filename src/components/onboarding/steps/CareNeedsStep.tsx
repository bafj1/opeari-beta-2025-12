import { MessageSquare, Check } from 'lucide-react';
import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, SelectionCard } from '../components/WizardUI';

interface CareNeedsStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
    showSomethingElseInput: boolean;
    setShowSomethingElseInput: (val: boolean) => void;
}

export default function CareNeedsStep({ data, updateData, showSomethingElseInput, setShowSomethingElseInput }: CareNeedsStepProps) {

    const toggleCareOption = (id: string) => {
        let newOptions = [...data.careOptions];
        if (id === 'exploring') {
            newOptions = newOptions.includes('exploring') ? [] : ['exploring'];
        } else {
            if (newOptions.includes('exploring')) newOptions = [];
            if (newOptions.includes(id)) {
                newOptions = newOptions.filter(i => i !== id);
            } else {
                newOptions.push(id);
            }
        }
        updateData('careOptions', newOptions);
    };

    const toggleSomethingElse = () => {
        setShowSomethingElseInput(!showSomethingElseInput);
        if (!showSomethingElseInput && data.careOptions.includes('exploring')) {
            updateData('careOptions', []);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="What would be helpful right now?" subtitle="Choose any that apply — most families pick 2-3." />

            {/* Find Support */}
            <div className="space-y-3">
                <h3 className="font-bold text-opeari-heading text-lg">Find Support</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="findSupportInterests">
                    {[
                        { id: 'nannyshare', label: 'Nanny Share', desc: 'Split costs with another family' },
                        { id: 'backup-care', label: 'Backup Care', desc: 'Sick days & emergencies' },
                        { id: 'babysitter', label: 'Babysitter', desc: 'Date nights & occasional help' },
                        { id: 'school-pickups', label: 'School Pickups', desc: 'Drop-off & pickup help' },
                        { id: 'playdates', label: 'Playdates', desc: 'Connect kids with friends' },
                        { id: 'travel-care', label: 'Travel / Au Pair', desc: 'Vacation & live-in care' }
                    ].map(opt => (
                        <SelectionCard
                            key={opt.id}
                            icon={Check}
                            label={opt.label}
                            desc={opt.desc}
                            selected={data.careOptions.includes(opt.id)}
                            onClick={() => toggleCareOption(opt.id)}
                            isCheckboxStyle={true}
                        />
                    ))}
                </div>
            </div>

            {/* Offer Support */}
            <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-opeari-heading text-lg">Offer Support</h3>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Optional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="offerSupportInterests">
                    {[
                        { id: 'offer-backup', label: 'Backup Care', desc: 'Help in emergencies' },
                        { id: 'offer-pickups', label: 'School Pickups', desc: 'Share driving duties' },
                        { id: 'host-share', label: 'Host Nanny Share', desc: 'Host at your home' },
                        { id: 'care-exchange', label: 'Care Exchange', desc: 'Trade hours with neighbors' }
                    ].map(opt => (
                        <SelectionCard
                            key={opt.id}
                            icon={Check}
                            label={opt.label}
                            desc={opt.desc}
                            selected={data.careOptions.includes(opt.id)}
                            onClick={() => toggleCareOption(opt.id)}
                            isCheckboxStyle={true}
                        />
                    ))}
                </div>
            </div>

            <div className="pt-4">
                <SelectionCard
                    icon={MessageSquare}
                    label="Something else"
                    desc="Tell us what you need"
                    selected={showSomethingElseInput}
                    onClick={toggleSomethingElse}
                    isCheckboxStyle={true}
                />
            </div>

            {showSomethingElseInput && (
                <div className="animate-fade-in">
                    <textarea
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opeari-green focus:outline-none placeholder:text-gray-400 text-sm"
                        rows={3}
                        placeholder="What specific situation are you navigating?"
                        value={data.specificNeeds || ''}
                        onChange={(e) => updateData('specificNeeds', e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}
