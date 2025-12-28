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
                        { id: 'shared-nanny', label: 'Shared Nanny', desc: 'Seasonal or ongoing care with 1–2 families' },
                        { id: 'part-time-nanny', label: 'Part-Time / Split-Schedule Nanny', desc: 'Mornings, afternoons, or a few days a week', isPopular: true },
                        { id: 'trusted-babysitter', label: 'Trusted Babysitter', desc: 'Date nights & occasional help' },
                        { id: 'backup-care', label: 'Backup Care', desc: 'Last-minute gaps & schedule changes' },
                        { id: 'school-pickups', label: 'School Pickups & Drop-Offs', desc: 'Drop-off & pickup help' },
                        { id: 'extra-hands', label: 'Extra Hands at Home', desc: 'Help while you work from home' },
                        { id: 'live-in', label: 'Live-In or Travel Support', desc: 'Vacation & extended stays' },
                        { id: 'something-else', label: 'Something else', desc: 'Tell us what you need' }
                    ].map(opt => (
                        <div key={opt.id} className="relative">
                            <SelectionCard
                                icon={Check}
                                label={opt.label}
                                desc={opt.desc}
                                selected={opt.id === 'something-else' ? showSomethingElseInput : data.careOptions.includes(opt.id)}
                                onClick={() => opt.id === 'something-else' ? toggleSomethingElse() : toggleCareOption(opt.id)}
                                isCheckboxStyle={true}
                            />
                            {/* Visual Elevation for Part-Time */}
                            {opt.isPopular && (
                                <div className="absolute -top-2 -right-2 bg-opeari-teal text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm z-10 pointer-events-none">
                                    Popular
                                </div>
                            )}
                            {/* Highlight border for popular */}
                            {opt.isPopular && (
                                <div className="absolute inset-0 border-2 border-opeari-teal/30 rounded-xl pointer-events-none" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Offer Support */}
            <div className="space-y-3 mt-6">
                <div>
                    <h3 className="font-bold text-opeari-heading text-lg">Offer Support (Optional)</h3>
                    <p className="text-sm text-gray-500 mt-1">Share only if you're open to helping occasionally — this helps us understand availability in your area.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="offerSupportInterests">
                    {[
                        { id: 'offer-pickups', label: 'School Pickups', desc: 'Open to sharing routine drop-off or pickup responsibilities' },
                        { id: 'host-share', label: 'Host Nanny Share', desc: 'Open to hosting care at your home' },
                        { id: 'care-exchange', label: 'Care Exchange', desc: 'Open to occasional care swaps with families you know' }
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
