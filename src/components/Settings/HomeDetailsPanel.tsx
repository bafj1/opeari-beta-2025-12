import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';
import {
    Home, Car, PawPrint,
    Save, Loader2, Check
} from 'lucide-react';

const HOME_TYPES = [
    { id: 'apartment', label: 'Apartment' },
    { id: 'condo', label: 'Condo' },
    { id: 'townhouse', label: 'Townhouse' },
    { id: 'single-family', label: 'Single Family Home' },
    { id: 'other', label: 'Other' },
];

const PET_TYPES = [
    { id: 'dog', label: 'Dog' },
    { id: 'cat', label: 'Cat' },
    { id: 'other', label: 'Other' },
];

const COMMON_ALLERGIES = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Wheat/Gluten',
    'Soy', 'Fish', 'Shellfish', 'Sesame', 'Dust', 'Pollen',
    'Pet Dander', 'Latex', 'Bee Stings',
];

interface HomeDetails {
    has_parking: boolean;
    has_stairs: boolean;
    home_type: string;
    num_floors: number;
    has_yard: boolean;
    has_pool: boolean;
    has_pets: boolean;
    pet_types: string[];
    pet_notes: string;
    home_allergies: string[];
    home_allergy_notes: string;
    home_notes: string;
    budget_min: number;
    budget_max: number;
}

export default function HomeDetailsPanel() {
    const { viewer } = useViewer();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [details, setDetails] = useState<HomeDetails>({
        has_parking: false,
        has_stairs: false,
        home_type: '',
        num_floors: 1,
        has_yard: false,
        has_pool: false,
        has_pets: false,
        pet_types: [],
        pet_notes: '',
        home_allergies: [],
        home_allergy_notes: '',
        home_notes: '',
        budget_min: 0,
        budget_max: 0,
    });

    useEffect(() => {
        async function loadHomeDetails() {
            if (!viewer?.member?.id) return;
            const { data, error } = await supabase
                .from('members')
                .select('has_parking, has_stairs, home_type, num_floors, has_yard, has_pool, has_pets, pet_types, pet_notes, home_allergies, home_allergy_notes, home_notes, budget_min, budget_max')
                .eq('id', viewer.member.id)
                .single();

            if (!error && data) {
                setDetails({
                    has_parking: data.has_parking || false,
                    has_stairs: data.has_stairs || false,
                    home_type: data.home_type || '',
                    num_floors: data.num_floors || 1,
                    has_yard: data.has_yard || false,
                    has_pool: data.has_pool || false,
                    has_pets: data.has_pets || false,
                    pet_types: data.pet_types || [],
                    pet_notes: data.pet_notes || '',
                    home_allergies: data.home_allergies || [],
                    home_allergy_notes: data.home_allergy_notes || '',
                    home_notes: data.home_notes || '',
                    budget_min: data.budget_min || 0,
                    budget_max: data.budget_max || 0,
                });
            }
        }
        loadHomeDetails();
    }, [viewer?.member?.id]);

    const handleSave = async () => {
        if (!viewer?.member?.id) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('members')
                .update({
                    ...details,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', viewer.member.id);

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Error saving home details:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleAllergy = (allergy: string) => {
        setDetails(prev => ({
            ...prev,
            home_allergies: prev.home_allergies.includes(allergy)
                ? prev.home_allergies.filter(a => a !== allergy)
                : [...prev.home_allergies, allergy],
        }));
    };

    const togglePetType = (petType: string) => {
        setDetails(prev => ({
            ...prev,
            pet_types: prev.pet_types.includes(petType)
                ? prev.pet_types.filter(p => p !== petType)
                : [...prev.pet_types, petType],
        }));
    };

    const featureToggles: { key: keyof HomeDetails; label: string; icon: React.ElementType }[] = [
        { key: 'has_parking', label: 'Parking available', icon: Car },
        { key: 'has_stairs', label: 'Has stairs', icon: Home },
        { key: 'has_yard', label: 'Has yard/outdoor space', icon: Home },
        { key: 'has_pool', label: 'Has pool', icon: Home },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-[#1e6b4e] mb-1">Home Details</h2>
                <p className="text-sm text-[#546E5C]">
                    Help caregivers know what to expect when they visit your home.
                </p>
            </div>

            {/* Home Type */}
            <section>
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">Home Type</h3>
                <div className="flex flex-wrap gap-2">
                    {HOME_TYPES.map(ht => (
                        <button
                            key={ht.id}
                            type="button"
                            onClick={() => setDetails(prev => ({ ...prev, home_type: ht.id }))}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${details.home_type === ht.id
                                ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                : 'bg-white text-[#546E5C] border-[#8bd7c7]/30 hover:border-[#8bd7c7]'
                                }`}
                        >
                            {ht.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Home Features */}
            <section>
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">Home Features</h3>
                <div className="grid grid-cols-2 gap-3">
                    {featureToggles.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setDetails(prev => ({ ...prev, [key]: !prev[key] }))}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${details[key]
                                ? 'bg-[#d8f5e5] border-[#8bd7c7] text-[#1e6b4e]'
                                : 'bg-white border-[#8bd7c7]/30 text-[#546E5C] hover:border-[#8bd7c7]/50'
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Pets */}
            <section>
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">Pets in the Home</h3>
                <button
                    type="button"
                    onClick={() => setDetails(prev => ({ ...prev, has_pets: !prev.has_pets }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors mb-3 ${details.has_pets
                        ? 'bg-[#d8f5e5] border-[#8bd7c7] text-[#1e6b4e]'
                        : 'bg-white border-[#8bd7c7]/30 text-[#546E5C]'
                        }`}
                >
                    <PawPrint className="w-5 h-5" />
                    <span className="text-sm font-medium">We have pets</span>
                </button>

                {details.has_pets && (
                    <div className="ml-2 space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {PET_TYPES.map(pt => (
                                <button
                                    key={pt.id}
                                    type="button"
                                    onClick={() => togglePetType(pt.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${details.pet_types.includes(pt.id)
                                        ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                        : 'bg-white text-[#546E5C] border-[#8bd7c7]/30'
                                        }`}
                                >
                                    {pt.label}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={details.pet_notes}
                            onChange={e => setDetails(prev => ({ ...prev, pet_notes: e.target.value }))}
                            placeholder="E.g., Friendly golden retriever, stays in a separate room during care hours..."
                            className="w-full px-4 py-2.5 border border-[#8bd7c7]/30 rounded-xl text-sm text-[#546E5C] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent resize-none"
                            rows={2}
                        />
                    </div>
                )}
            </section>

            {/* Household Allergies */}
            <section>
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-1">Household Allergies</h3>
                <p className="text-xs text-[#546E5C] mb-3">Select any allergies caregivers should be aware of.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_ALLERGIES.map(allergy => (
                        <button
                            key={allergy}
                            type="button"
                            onClick={() => toggleAllergy(allergy)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${details.home_allergies.includes(allergy)
                                ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                                : 'bg-white text-[#546E5C] border-[#8bd7c7]/30 hover:border-[#FCD34D]/50'
                                }`}
                        >
                            {allergy}
                        </button>
                    ))}
                </div>
                <textarea
                    value={details.home_allergy_notes}
                    onChange={e => setDetails(prev => ({ ...prev, home_allergy_notes: e.target.value }))}
                    placeholder="Additional allergy details or severity notes..."
                    className="w-full px-4 py-2.5 border border-[#8bd7c7]/30 rounded-xl text-sm text-[#546E5C] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent resize-none"
                    rows={2}
                />
            </section>

            {/* Additional Home Notes */}
            <section>
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">Additional Notes</h3>
                <textarea
                    value={details.home_notes}
                    onChange={e => setDetails(prev => ({ ...prev, home_notes: e.target.value }))}
                    placeholder="Anything else a caregiver should know about your home? E.g., gate code, nearby park, quiet hours..."
                    className="w-full px-4 py-2.5 border border-[#8bd7c7]/30 rounded-xl text-sm text-[#546E5C] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent resize-none"
                    rows={3}
                />
            </section>

            {/* Budget Range */}
            <section>
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-1">
                    Budget Range ($/hr)
                </h3>
                <p className="text-xs text-[#546E5C] mb-3">
                    What you can pay per hour (optional, helps filter matches).
                </p>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        value={details.budget_min || ''}
                        onChange={e => setDetails(prev => ({ ...prev, budget_min: parseInt(e.target.value) || 0 }))}
                        placeholder="20"
                        className="w-24 px-3 py-2.5 border-2 border-[#8bd7c7]/30 rounded-xl text-sm text-[#1e6b4e] text-center focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent"
                        min={0}
                    />
                    <span className="text-sm text-[#546E5C]">to</span>
                    <input
                        type="number"
                        value={details.budget_max || ''}
                        onChange={e => setDetails(prev => ({ ...prev, budget_max: parseInt(e.target.value) || 0 }))}
                        placeholder="40"
                        className="w-24 px-3 py-2.5 border-2 border-[#8bd7c7]/30 rounded-xl text-sm text-[#1e6b4e] text-center focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent"
                        min={0}
                    />
                </div>
            </section>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-2 -mx-1 px-1">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#174f3a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Home Details
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
