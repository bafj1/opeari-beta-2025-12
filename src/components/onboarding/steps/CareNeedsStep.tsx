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

    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader
                title="What support would help?"
                subtitle=""
            />

            {/* Find Support */}
            <div className="space-y-3">
                <div className="mb-2">
                    <h3 className="text-lg leading-tight">
                        <span className="font-bold text-opeari-heading">Find Support</span>
                        <span className="text-gray-500 font-normal"> — choose any that apply, most families pick 2–3.</span>
                    </h3>
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
                                selected={opt.id === 'something-else' ? (data.careNeedOptions || []).includes('something-else') : (data.careNeedOptions || []).includes(opt.id)}
                                onClick={() => {
                                    if (opt.id === 'something-else') {
                                        // Toggle logic for something else
                                        let newOpts = [...(data.careNeedOptions || [])];
                                        if (newOpts.includes('something-else')) {
                                            newOpts = newOpts.filter(o => o !== 'something-else');
                                            setShowSomethingElseInput(false);
                                            updateData('careSpecificNeeds', ''); // Clear text
                                        } else {
                                            newOpts.push('something-else');
                                            setShowSomethingElseInput(true);
                                        }
                                        updateData('careNeedOptions', newOpts);
                                    } else {
                                        // Toggle standard need
                                        let newOpts = [...(data.careNeedOptions || [])];
                                        if (newOpts.includes(opt.id)) {
                                            newOpts = newOpts.filter(o => o !== opt.id);
                                        } else {
                                            newOpts.push(opt.id);
                                        }
                                        updateData('careNeedOptions', newOpts);
                                    }
                                }}
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
                            value={data.careSpecificNeeds || ''}
                            onChange={(e) => updateData('careSpecificNeeds', e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Offer Support */}
            <div className="space-y-3 mt-8">
                <div>
                    <h3 className="font-bold text-opeari-heading text-lg">
                        Offer Support <span className="text-gray-400 font-normal">(Optional)</span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Help neighbors when you can — no commitment required.</p>
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
                                selected={(data.careOfferOptions || []).includes(opt.id)}
                                onClick={() => {
                                    let newOpts = [...(data.careOfferOptions || [])];
                                    if (newOpts.includes(opt.id)) {
                                        newOpts = newOpts.filter(o => o !== opt.id);
                                        if (opt.id === 'host-share') {
                                            updateData('hostingInterest', false); // Sync legacy field
                                        }
                                    } else {
                                        newOpts.push(opt.id);
                                        if (opt.id === 'host-share') {
                                            updateData('hostingInterest', true); // Sync legacy field
                                        }
                                    }
                                    updateData('careOfferOptions', newOpts);
                                }}
                                isCheckboxStyle={true}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* INTEL-LITE: Target Budget & Current Setup (Moved from FamilyStep) */}
            <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Budget Range Selector */}
                <div>
                    <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide mb-1.5">Target Hourly Budget (Optional)</label>
                    <div className="relative">
                        <select
                            value={data.targetBudget || ''}
                            onChange={(e) => updateData('targetBudget', e.target.value)}
                            className="w-full px-4 py-[13px] border border-gray-200/50 rounded-xl bg-white appearance-none focus:ring-2 focus:ring-opeari-green focus:outline-none text-opeari-heading"
                        >
                            <option value="" disabled>Select...</option>
                            <option value="under-20">Under $20/hr</option>
                            <option value="20-25">$20 - $25/hr</option>
                            <option value="25-30">$25 - $30/hr</option>
                            <option value="30-35">$30 - $35/hr</option>
                            <option value="35-40">$35 - $40/hr</option>
                            <option value="40+">$40+/hr</option>
                            <option value="not-sure">Not sure yet</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>

                {/* Current Care Setup */}
                <div>
                    <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide mb-1.5">Current Care Situation (Optional)</label>
                    <div className="relative">
                        <select
                            value={data.currentCareSetup || ''}
                            onChange={(e) => updateData('currentCareSetup', e.target.value)}
                            className="w-full px-4 py-[13px] border border-gray-200/50 rounded-xl bg-white appearance-none focus:ring-2 focus:ring-opeari-green focus:outline-none text-opeari-heading"
                        >
                            <option value="" disabled>Select...</option>
                            <option value="Family / Self">Family / Self</option>
                            <option value="Daycare / Preschool">Daycare / Preschool</option>
                            <option value="Nanny">Nanny</option>
                            <option value="Nanny Share">Nanny Share</option>
                            <option value="Babysitter / Occasional">Babysitter / Occasional</option>
                            <option value="Combination">Combination of the above</option>
                            <option value="Other">Other</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
