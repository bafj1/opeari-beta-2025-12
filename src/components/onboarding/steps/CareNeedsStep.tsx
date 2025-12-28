import { Check } from 'lucide-react';
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
        // Remove specific logic for 'exploring' as it's not in the new list, 
        // but keep the basic toggle logic clean.
        if (newOptions.includes(id)) {
            newOptions = newOptions.filter(i => i !== id);
        } else {
            newOptions.push(id);
        }
        updateData('careOptions', newOptions);
    };

    const toggleSomethingElse = () => {
        const newState = !showSomethingElseInput;
        setShowSomethingElseInput(newState);

        let newOptions = [...data.careOptions];
        if (newState) {
            if (!newOptions.includes('something-else')) {
                newOptions.push('something-else');
            }
        } else {
            newOptions = newOptions.filter(i => i !== 'something-else');
            updateData('specificNeeds', ''); // Clear input when deselected
        }
        updateData('careOptions', newOptions);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="What support would help?" subtitle="Your village can take many forms." />

            {/* Find Support */}
            <div className="space-y-3">
                <div className="mb-2">
                    <h3 className="font-bold text-opeari-heading text-lg leading-tight">Find Support</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose any that apply — most families pick 2–3.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="findSupportInterests">
                    {[
                        { id: 'nanny-share', label: 'Nanny Share', desc: 'Seasonal or ongoing care with 1–2 families' },
                        { id: 'part-time-nanny', label: 'Part-Time Nanny', desc: 'Mornings, afternoons, or shared schedules' },
                        { id: 'trusted-babysitter', label: 'Trusted Babysitter', desc: 'Date nights & occasional help' },
                        { id: 'backup-care', label: 'Backup Care', desc: 'Last-minute gaps & schedule changes' },
                        { id: 'carpool', label: 'Carpool & School Runs', desc: 'Drop-off & pickup help' },
                        { id: 'helper', label: 'Helper at Home', desc: 'Support while you work from home' },
                        { id: 'live-in', label: 'Live-In / Travel Care', desc: 'Vacation & extended stays' },
                        { id: 'something-else', label: 'Something else', desc: 'Tell us what you need' }
                    ].map(opt => (
                        <div key={opt.id} className="relative h-full">
                            <SelectionCard
                                icon={Check}
                                label={opt.label}
                                desc={opt.desc}
                                selected={opt.id === 'something-else' ? showSomethingElseInput : data.careOptions.includes(opt.id)}
                                onClick={() => opt.id === 'something-else' ? toggleSomethingElse() : toggleCareOption(opt.id)}
                                isCheckboxStyle={true}
                            />
                        </div>
                    ))}
                </div>

                {showSomethingElseInput && (
                    <div className="animate-fade-in pt-2">
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

            {/* Offer Support */}
            <div className="space-y-3 mt-8">
                <div>
                    <h3 className="font-bold text-opeari-heading text-lg">Offer Support (Optional)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="offerSupportInterests">
                    {[
                        { id: 'offer-pickups', label: 'School Pickups', desc: 'Open to sharing routine drop-off or pickup responsibilities' },
                        { id: 'host-share', label: 'Host Nanny Share', desc: 'Open to hosting care at your home' },
                        { id: 'care-exchange', label: 'Care Exchange', desc: 'Open to occasional care swaps with families you know' },
                        { id: 'offer-backup', label: 'Backup Care', desc: 'Available to help neighbors in a pinch' }
                    ].map(opt => (
                        <div key={opt.id} className="h-full">
                            <SelectionCard
                                icon={Check}
                                label={opt.label}
                                desc={opt.desc}
                                selected={data.careOptions.includes(opt.id)}
                                onClick={() => toggleCareOption(opt.id)}
                                isCheckboxStyle={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
