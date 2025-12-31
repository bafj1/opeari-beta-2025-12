import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, Input } from '../components/WizardUI';
import { Plus, X } from 'lucide-react';

interface CaregiverVerificationStepProps {
    data?: OnboardingData;
    updateData?: (field: keyof OnboardingData, value: any) => void;
}

export default function CaregiverVerificationStep({ data, updateData }: CaregiverVerificationStepProps) {
    // Fallback if props aren't passed (though they should be)
    if (!data || !updateData) return null;

    const referrals = data.referrals || [];

    const addReferral = () => {
        updateData('referrals', [...referrals, { name: '', email: '', phone: '', relation: '', description: '' }]);
    };

    const updateReferral = (index: number, field: string, value: string) => {
        const updated = [...referrals];
        updated[index] = { ...updated[index], [field]: value };
        updateData('referrals', updated);
    };

    const removeReferral = (index: number) => {
        updateData('referrals', referrals.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <StepHeader
                title="Trust & Safety"
                subtitle="References help families trust you faster."
            />

            <div className="bg-[#f0faf4] border-l-4 border-opeari-heading p-4 rounded-r-lg mb-6">
                <p className="text-opeari-heading text-sm leading-relaxed">
                    We require a background check for all active caregivers. For now, please provide 2-3 references we can contact.
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">References</h3>
                    <button
                        onClick={addReferral}
                        className="text-sm font-bold text-[#1e6b4e] hover:text-[#16503a] flex items-center gap-1"
                    >
                        <Plus size={16} /> Add Reference
                    </button>
                </div>

                {referrals.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                        <p className="text-sm">No references added yet.</p>
                        <button onClick={addReferral} className="mt-2 text-[#1e6b4e] font-bold text-sm underline">Add your first reference</button>
                    </div>
                )}

                {referrals.map((ref, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-3 relative bg-white">
                        <button
                            onClick={() => removeReferral(idx)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                        >
                            <X size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                                label="Full Name"
                                value={ref.name}
                                onChange={(v: string) => updateReferral(idx, 'name', v)}
                                placeholder="Jane Smith"
                            />
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide">
                                    Relationship
                                </label>
                                <div className="relative">
                                    <select
                                        value={ref.relation}
                                        onChange={(e) => updateReferral(idx, 'relation', e.target.value)}
                                        className="w-full px-4 py-3 border border-opeari-border/50 rounded-xl focus:ring-2 focus:ring-opeari-green focus:outline-none focus:border-transparent transition-all text-gray-700 appearance-none bg-white"
                                    >
                                        <option value="" disabled>Select relationship...</option>
                                        <option value="Previous Employer">Previous Employer</option>
                                        <option value="Family Member">Family Member</option>
                                        <option value="Friend / Colleague">Friend / Colleague</option>
                                        <option value="Teacher / Professor">Teacher / Professor</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                                label="Email"
                                value={ref.email}
                                onChange={(v: string) => updateReferral(idx, 'email', v)}
                                placeholder="jane@example.com"
                            />
                            <Input
                                label="Phone"
                                value={ref.phone}
                                onChange={(v: string) => updateReferral(idx, 'phone', v)}
                                placeholder="(555) 555-5555"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={ref.description}
                                onChange={(e) => updateReferral(idx, 'description', e.target.value)}
                                className="w-full p-3 border border-opeari-border/50 rounded-xl focus:ring-2 focus:ring-opeari-green focus:outline-none text-sm min-h-[80px]"
                                placeholder="Briefly describe what you did for them..."
                            />
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
                Your profile will be marked as "Pending Verification" until checks are complete.
            </p>
        </div>
    );
}
