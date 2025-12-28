import { ChevronDown, Check } from 'lucide-react';
import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, Input } from '../components/WizardUI';

interface FamilyStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 18 }, (_, i) => (CURRENT_YEAR - i).toString());

const EXPECTING_TIMING_OPTIONS = [
    'Within the next few months',
    'Later this year',
    'Early next year',
    'Just found out!'
];

export default function FamilyStep({ data, updateData }: FamilyStepProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="Tell us about your family" subtitle="This helps us match you with families whose kids would actually play well together." />

            {data.kids.map((kid, idx) => (
                <div key={kid.id} className="p-5 bg-white border border-gray-200 rounded-xl relative shadow-sm">
                    <button
                        onClick={() => {
                            const updatedKids = [...data.kids];
                            updatedKids.splice(idx, 1);
                            updateData('kids', updatedKids);
                        }}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                    >✕</button>
                    <h4 className="font-bold text-opeari-heading mb-3 uppercase tracking-wide text-xs">Child {idx + 1}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={kid.firstName}
                            onChange={(v: any) => {
                                const updatedKids = [...data.kids];
                                updatedKids[idx].firstName = v;
                                updateData('kids', updatedKids);
                            }}
                        />
                        <div>
                            <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide mb-1.5">Year Born</label>
                            <div className="relative">
                                <select
                                    value={kid.age}
                                    onChange={e => {
                                        const updatedKids = [...data.kids];
                                        updatedKids[idx].age = e.target.value;
                                        updateData('kids', updatedKids);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white appearance-none focus:ring-2 focus:ring-opeari-green focus:outline-none"
                                >
                                    <option value="" disabled>Select</option>
                                    {BIRTH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add Child Button */}
            <button
                onClick={() => updateData('kids', [...data.kids, { id: Math.random().toString(), firstName: '', nickname: '', age: '' }])}
                className="w-full py-3 border-2 border-dashed border-opeari-mint text-[#1e6b4e] font-bold rounded-xl hover:bg-[#e8f5f0] hover:border-[#1e6b4e] transition-all"
            >
                + Add Child
            </button>

            {/* Expecting */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${data.expecting ? 'border-[#1e6b4e] bg-[#f0faf4]' : 'border-gray-200'}`}>
                    <input type="checkbox" checked={data.expecting} onChange={e => updateData('expecting', e.target.checked)} className="sr-only" />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${data.expecting ? 'bg-[#1e6b4e] border-[#1e6b4e]' : 'bg-white border-gray-300'}`}>
                        {data.expecting && <Check size={14} className="text-white" />}
                    </div>
                    <div>
                        <p className="font-semibold text-opeari-heading">We're expecting</p>
                        <p className="text-sm text-gray-500">We'll include you in future matching</p>
                    </div>
                </label>
                {data.expecting && (
                    <div className="mt-3 animate-fade-in">
                        <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide mb-1.5">When is baby arriving?</label>
                        <div className="relative">
                            <select
                                value={data.expectingTiming || ''}
                                onChange={e => updateData('expectingTiming', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white appearance-none text-sm focus:ring-2 focus:ring-opeari-green focus:outline-none"
                            >
                                <option value="" disabled>Select one...</option>
                                {EXPECTING_TIMING_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
