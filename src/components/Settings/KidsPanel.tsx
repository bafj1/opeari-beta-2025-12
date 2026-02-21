import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Baby, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';

interface Kid {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    birth_year?: number | null;
    birth_month?: number | null;
    gender: string | null;
    notes: string | null;
    show_name?: boolean;
    display_name?: string | null;
    weight_range?: string | null;
    allergies?: string[];
    allergy_notes?: string | null;
    special_needs?: string | null;
    personality_notes?: string | null;
    nap_schedule?: string | null;
    bedtime?: string | null;
    daily_routines?: string | null;
    favorite_foods?: string | null;
    birthday?: string | null;
}

const GENDER_OPTIONS = [
    { value: '', label: 'Prefer not to say' },
    { value: 'boy', label: 'Boy' },
    { value: 'girl', label: 'Girl' },
    { value: 'nonbinary', label: 'Nonbinary' },
];

const WEIGHT_RANGES = [
    { id: 'under-15', label: 'Under 15 lbs' },
    { id: '15-30', label: '15-30 lbs' },
    { id: '30-50', label: '30-50 lbs' },
    { id: 'over-50', label: 'Over 50 lbs' },
];

const CHILD_ALLERGIES = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Wheat/Gluten',
    'Soy', 'Fish', 'Shellfish', 'Sesame', 'Strawberries',
    'Latex', 'Bee Stings', 'Medications',
];

const NAP_OPTIONS = [
    { value: '', label: 'Select...' },
    { value: 'no_naps', label: 'No naps' },
    { value: '1_nap', label: '1 nap' },
    { value: '2_naps', label: '2 naps' },
    { value: '3_naps', label: '3 naps' },
    { value: '4_plus_naps', label: '4+ naps' },
    { value: 'varies', label: 'Varies / on demand' },
];

export default function KidsPanel() {
    const { viewer } = useViewer();
    const [kids, setKids] = useState<Kid[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingKid, setEditingKid] = useState<Kid | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [gender, setGender] = useState('');
    const [notes, setNotes] = useState('');
    const [showName, setShowName] = useState(true);
    const [weightRange, setWeightRange] = useState('');
    const [allergies, setAllergies] = useState<string[]>([]);
    const [allergyNotes, setAllergyNotes] = useState('');
    const [specialNeeds, setSpecialNeeds] = useState('');
    const [personalityNotes, setPersonalityNotes] = useState('');
    const [napSchedule, setNapSchedule] = useState('');
    const [bedtime, setBedtime] = useState('');
    const [dailyRoutines, setDailyRoutines] = useState('');
    const [favoriteFoods, setFavoriteFoods] = useState('');

    // UI state
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [openSection, setOpenSection] = useState<string | null>('health');

    useEffect(() => {
        if (viewer?.user?.id) fetchKids();
    }, [viewer?.user?.id]);

    const fetchKids = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('kids')
                .select('*')
                .eq('user_id', viewer?.user?.id)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setKids(data || []);
        } catch (err) {
            console.error('Error fetching kids:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setBirthMonth('');
        setBirthYear('');
        setGender('');
        setNotes('');
        setShowName(true);
        setWeightRange('');
        setAllergies([]);
        setAllergyNotes('');
        setSpecialNeeds('');
        setPersonalityNotes('');
        setNapSchedule('');
        setBedtime('');
        setDailyRoutines('');
        setFavoriteFoods('');
        setEditingKid(null);
        setIsAdding(false);
        setOpenSection('health');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewer?.user?.id || !firstName.trim() || !birthMonth || !birthYear) return;

        setSaving(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
            const computedDisplayName = showName ? firstName.trim() : (firstName.trim()?.[0] || '');

            const payload: Record<string, any> = {
                user_id: viewer.user.id,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                name: fullName,
                birth_month: parseInt(birthMonth),
                birth_year: parseInt(birthYear),
                gender: gender || null,
                weight_range: weightRange || null,
                allergies: allergies,
                allergy_notes: allergyNotes || null,
                special_needs: specialNeeds || null,
                nap_schedule: napSchedule || null,
                bedtime: bedtime || null,
                daily_routines: dailyRoutines || null,
                favorite_foods: favoriteFoods || null,
                personality_notes: personalityNotes || null,
                display_name: computedDisplayName,
                show_name: showName === true || (showName as any) === 'true' ? true : false,
                notes: notes || null,
            };

            if (editingKid) {
                const { error } = await supabase
                    .from('kids')
                    .update(payload)
                    .eq('id', editingKid.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('kids')
                    .insert([payload]);
                if (error) throw error;
            }

            await fetchKids();
            resetForm();
            setMessage({ type: 'success', text: editingKid ? 'Updated successfully.' : 'Child added.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('Error saving kid:', err);
            setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this child?')) return;
        try {
            const { error } = await supabase.from('kids').delete().eq('id', id);
            if (error) throw error;
            await fetchKids();
            setMessage({ type: 'success', text: 'Child removed.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('Error deleting kid:', err);
        }
    };

    const startEdit = (kid: Kid) => {
        setEditingKid(kid);
        // Split name into first/last if first_name not set
        if (kid.first_name) {
            setFirstName(kid.first_name);
            setLastName(kid.last_name || '');
        } else {
            const parts = (kid.name || '').split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }
        if (kid.birth_month && kid.birth_year) {
            setBirthMonth(String(kid.birth_month).padStart(2, '0'));
            setBirthYear(String(kid.birth_year));
        } else if (kid.birthday) {
            const date = new Date(kid.birthday);
            setBirthMonth(String(date.getMonth() + 1).padStart(2, '0'));
            setBirthYear(String(date.getFullYear()));
        } else {
            setBirthMonth('');
            setBirthYear('');
        }
        setGender(kid.gender || '');
        setNotes(kid.notes || '');
        setShowName(kid.show_name !== false);
        setWeightRange(kid.weight_range || '');
        setAllergies(kid.allergies || []);
        setAllergyNotes(kid.allergy_notes || '');
        setSpecialNeeds(kid.special_needs || '');
        setPersonalityNotes(kid.personality_notes || '');
        setNapSchedule(kid.nap_schedule || '');
        setBedtime(kid.bedtime || '');
        setDailyRoutines(kid.daily_routines || '');
        setFavoriteFoods(kid.favorite_foods || '');
        setIsAdding(true);
        setOpenSection('health');
    };

    const calculateAge = (kid: Kid): string | null => {
        if (!kid.birth_month && !kid.birth_year && !kid.birthday) return null;
        let birthM: number;
        let birthY: number;
        if (kid.birth_month && kid.birth_year) {
            birthM = kid.birth_month;
            birthY = kid.birth_year;
        } else if (kid.birthday) {
            const d = new Date(kid.birthday);
            birthM = d.getMonth() + 1;
            birthY = d.getFullYear();
        } else {
            return null;
        }
        const now = new Date();
        const months = (now.getFullYear() - birthY) * 12 + (now.getMonth() + 1 - birthM);
        if (months < 0) return null;
        if (months < 12) return `${months}mo`;
        return `${Math.floor(months / 12)}y`;
    };

    // Styles
    const cardStyle = {
        padding: '24px',
        border: '2px solid rgba(139,215,199,0.3)',
        borderRadius: '20px',
        backgroundColor: 'white',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        border: '2px solid rgba(139,215,199,0.3)',
        borderRadius: '12px',
        fontSize: '14px',
        color: '#1E6B4E',
        fontFamily: 'Comfortaa, sans-serif',
        outline: 'none',
        backgroundColor: 'white',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: '#1E6B4E',
        marginBottom: '6px',
        fontFamily: 'Comfortaa, sans-serif',
    };

    const textareaStyle: React.CSSProperties = {
        ...inputStyle,
        resize: 'vertical' as const,
    };

    const genderColors: Record<string, { bg: string; text: string }> = {
        boy: { bg: '#E3F2FD', text: '#1976D2' },
        male: { bg: '#E3F2FD', text: '#1976D2' },
        girl: { bg: '#FCE4EC', text: '#C2185B' },
        female: { bg: '#FCE4EC', text: '#C2185B' },
        nonbinary: { bg: '#F3E5F5', text: '#7B1FA2' },
        'non-binary': { bg: '#F3E5F5', text: '#7B1FA2' },
        default: { bg: 'rgba(139,215,199,0.15)', text: '#1E6B4E' },
    };

    // Collapsible section header
    const SectionHeader = ({ id, title, subtitle }: { id: string; title: string; subtitle: string }) => (
        <button
            type="button"
            onClick={() => setOpenSection(openSection === id ? null : id)}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0', background: 'none', border: 'none', borderTop: '1px solid #e8efe8',
                cursor: 'pointer', fontFamily: 'Comfortaa, cursive', textAlign: 'left',
            }}
        >
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E6B4E' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#6b7f76', marginTop: 2 }}>{subtitle}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                style={{ transition: 'transform 0.2s', transform: openSection === id ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>
                <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#6b7f76" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </button>
    );

    if (loading && !kids.length) {
        return (
            <div style={{ padding: '48px', textAlign: 'center', color: '#546E5C' }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px', maxWidth: '720px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E6B4E', margin: 0 }}>Your Children</h2>
                    <p style={{ fontSize: '13px', color: '#546E5C', marginTop: '4px' }}>
                        Add your children so families can learn about your household
                    </p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', backgroundColor: '#1E6B4E', color: 'white',
                            border: 'none', borderRadius: '50px', fontWeight: 600,
                            fontSize: '14px', fontFamily: 'Comfortaa, sans-serif', cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} />
                        Add Child
                    </button>
                )}
            </div>

            {/* Success/Error Message */}
            {message && (
                <div style={{
                    padding: '12px 16px', borderRadius: '12px',
                    backgroundColor: message.type === 'success' ? 'rgba(139,215,199,0.15)' : 'rgba(224,122,95,0.1)',
                    color: message.type === 'success' ? '#1E6B4E' : '#E07A5F',
                    fontSize: '13px', fontWeight: 500,
                }}>
                    {message.text}
                </div>
            )}

            {/* Add/Edit Form */}
            {isAdding && (
                <div style={{
                    ...cardStyle,
                    backgroundColor: 'rgba(139,215,199,0.05)',
                    border: '2px solid rgba(139,215,199,0.3)',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E6B4E', margin: '0 0 16px' }}>
                        {editingKid ? 'Edit Child' : 'Add a Child'}
                    </h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* ═══ SECTION 1: THE BASICS (always visible) ═══ */}

                        {/* First Name / Last Name */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input
                                    required
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder="First name"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder="Last name (optional)"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Birthday (Month + Year) + Gender */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Birth Month</label>
                                <select required value={birthMonth} onChange={e => setBirthMonth(e.target.value)} style={inputStyle}>
                                    <option value="">Month</option>
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                        .map((m, i) => (
                                            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Birth Year</label>
                                <select required value={birthYear} onChange={e => setBirthYear(e.target.value)} style={inputStyle}>
                                    <option value="">Year</option>
                                    {Array.from({ length: 18 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Gender (optional)</label>
                                <select value={gender} onChange={e => setGender(e.target.value)} style={inputStyle}>
                                    {GENDER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Weight Range */}
                        <div>
                            <label style={labelStyle}>Weight Range (optional)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {WEIGHT_RANGES.map(wr => (
                                    <button
                                        key={wr.id}
                                        type="button"
                                        onClick={() => setWeightRange(weightRange === wr.id ? '' : wr.id)}
                                        style={{
                                            padding: '6px 14px', borderRadius: '20px',
                                            border: `1.5px solid ${weightRange === wr.id ? '#1E6B4E' : 'rgba(139,215,199,0.3)'}`,
                                            backgroundColor: weightRange === wr.id ? '#d8f5e5' : 'white',
                                            color: '#1E6B4E', fontSize: '12px',
                                            fontWeight: weightRange === wr.id ? 600 : 400,
                                            cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                        }}
                                    >
                                        {wr.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Show Name Toggle */}
                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-[#8bd7c7]/10">
                            <div>
                                <p className="text-sm font-medium text-[#1e6b4e]">Show name on profile</p>
                                <p className="text-xs text-[#546E5C]">Others will see &quot;{firstName ? firstName[0] : 'C'}.&quot; instead of the full name</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowName(!showName)}
                                className={`relative w-10 h-6 rounded-full transition-colors ${showName ? 'bg-[#1e6b4e]' : 'bg-gray-300'}`}
                                aria-label="Toggle name display"
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showName ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* ═══ SECTION 2: HEALTH & SAFETY (collapsible) ═══ */}
                        <SectionHeader id="health" title="Health and Safety" subtitle="Allergies, special needs, and medical info" />
                        {openSection === 'health' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
                                {/* Allergies */}
                                <div>
                                    <label style={labelStyle}>Allergies (optional)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                        {CHILD_ALLERGIES.map(allergy => (
                                            <button
                                                key={allergy}
                                                type="button"
                                                onClick={() => setAllergies(prev =>
                                                    prev.includes(allergy)
                                                        ? prev.filter(a => a !== allergy)
                                                        : [...prev, allergy]
                                                )}
                                                style={{
                                                    padding: '5px 12px', borderRadius: '20px',
                                                    border: `1.5px solid ${allergies.includes(allergy) ? '#FCD34D' : 'rgba(139,215,199,0.3)'}`,
                                                    backgroundColor: allergies.includes(allergy) ? '#FEF3C7' : 'white',
                                                    color: allergies.includes(allergy) ? '#92400E' : '#546E5C',
                                                    fontSize: '11px',
                                                    fontWeight: allergies.includes(allergy) ? 600 : 400,
                                                    cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                                }}
                                            >
                                                {allergy}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={allergyNotes}
                                        onChange={e => setAllergyNotes(e.target.value)}
                                        placeholder="Severity details, EpiPen info, etc."
                                        rows={2}
                                        spellCheck={true}
                                        style={textareaStyle}
                                    />
                                </div>

                                {/* Special Needs */}
                                <div>
                                    <label style={labelStyle}>Special Needs (optional)</label>
                                    <textarea
                                        value={specialNeeds}
                                        onChange={e => setSpecialNeeds(e.target.value)}
                                        placeholder="Any diagnoses, therapies, or accommodations caregivers should be aware of..."
                                        rows={2}
                                        spellCheck={true}
                                        style={textareaStyle}
                                    />
                                </div>

                                {/* Emergency contact reference */}
                                <p style={{ fontSize: 12, color: '#6b7f76', fontFamily: 'Comfortaa, cursive', margin: 0 }}>
                                    Family emergency contact is managed in your Profile settings.
                                </p>
                            </div>
                        )}

                        {/* ═══ SECTION 3: CARE DETAILS (collapsible) ═══ */}
                        <SectionHeader id="care" title="Care Details" subtitle="Routines, meals, and personality" />
                        {openSection === 'care' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
                                {/* Nap Schedule */}
                                <div>
                                    <label style={labelStyle}>Nap Schedule (optional)</label>
                                    <select value={napSchedule} onChange={e => setNapSchedule(e.target.value)} style={inputStyle}>
                                        {NAP_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Bedtime */}
                                <div>
                                    <label style={labelStyle}>Bedtime (optional)</label>
                                    <input
                                        type="text"
                                        value={bedtime}
                                        onChange={e => setBedtime(e.target.value)}
                                        placeholder="e.g. 7:30 PM"
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Daily Routines */}
                                <div>
                                    <label style={labelStyle}>Daily Routines (optional)</label>
                                    <textarea
                                        value={dailyRoutines}
                                        onChange={e => setDailyRoutines(e.target.value)}
                                        placeholder="Anything a caregiver should know about their typical day..."
                                        rows={2}
                                        spellCheck={true}
                                        style={textareaStyle}
                                    />
                                </div>

                                {/* Favorite Foods */}
                                <div>
                                    <label style={labelStyle}>Favorite Foods (optional)</label>
                                    <textarea
                                        value={favoriteFoods}
                                        onChange={e => setFavoriteFoods(e.target.value)}
                                        placeholder="Favorite meals, snacks, comfort foods..."
                                        rows={2}
                                        spellCheck={true}
                                        style={textareaStyle}
                                    />
                                </div>

                                {/* Personality Notes */}
                                <div>
                                    <label style={labelStyle}>Personality Notes (optional)</label>
                                    <textarea
                                        value={personalityNotes}
                                        onChange={e => setPersonalityNotes(e.target.value)}
                                        placeholder="E.g., Loves dinosaurs, shy around new people, very active..."
                                        rows={2}
                                        spellCheck={true}
                                        style={textareaStyle}
                                    />
                                </div>

                                {/* General Notes */}
                                <div>
                                    <label style={labelStyle}>Additional Notes (optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Anything else a caregiver should know..."
                                        rows={2}
                                        spellCheck={true}
                                        style={textareaStyle}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: '10px 20px', border: '2px solid rgba(139,215,199,0.5)',
                                    borderRadius: '50px', color: '#1E6B4E', fontWeight: 600,
                                    fontSize: '14px', fontFamily: 'Comfortaa, sans-serif',
                                    backgroundColor: 'transparent', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !firstName.trim() || !birthMonth || !birthYear}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 24px', backgroundColor: '#1E6B4E', color: 'white',
                                    border: 'none', borderRadius: '50px', fontWeight: 600,
                                    fontSize: '14px', fontFamily: 'Comfortaa, sans-serif',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: (saving || !firstName.trim() || !birthMonth || !birthYear) ? 0.5 : 1,
                                }}
                            >
                                {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                {saving ? 'Saving...' : editingKid ? 'Update' : 'Add Child'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Kids List */}
            {kids.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {kids.map(kid => {
                        const age = calculateAge(kid);
                        const gc = genderColors[kid.gender || 'default'] || genderColors.default;
                        const displayFirstName = kid.first_name || kid.name?.split(' ')[0] || '?';

                        return (
                            <div
                                key={kid.id}
                                style={{
                                    ...cardStyle,
                                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    backgroundColor: gc.bg, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: '20px', fontWeight: 700, color: gc.text }}>
                                        {displayFirstName.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E6B4E' }}>
                                            {kid.show_name !== false
                                                ? (kid.first_name ? `${kid.first_name} ${kid.last_name || ''}`.trim() : kid.name)
                                                : `${displayFirstName.charAt(0).toUpperCase()}.`
                                            }
                                        </span>
                                        {age && (
                                            <span style={{
                                                padding: '2px 10px', borderRadius: '12px',
                                                backgroundColor: gc.bg, color: gc.text,
                                                fontSize: '12px', fontWeight: 600,
                                            }}>
                                                {age}
                                            </span>
                                        )}
                                        {kid.gender && (
                                            <span style={{
                                                padding: '2px 10px', borderRadius: '12px',
                                                backgroundColor: gc.bg, color: gc.text,
                                                fontSize: '12px', fontWeight: 500, textTransform: 'capitalize',
                                            }}>
                                                {kid.gender}
                                            </span>
                                        )}
                                    </div>
                                    {kid.notes && (
                                        <p style={{
                                            fontSize: '13px', color: '#546E5C', marginTop: '4px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {kid.notes}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    <button
                                        onClick={() => startEdit(kid)}
                                        style={{
                                            padding: '8px', border: 'none', backgroundColor: 'transparent',
                                            cursor: 'pointer', borderRadius: '8px', color: '#546E5C',
                                        }}
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(kid.id)}
                                        style={{
                                            padding: '8px', border: 'none', backgroundColor: 'transparent',
                                            cursor: 'pointer', borderRadius: '8px', color: '#546E5C',
                                        }}
                                        title="Remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : !isAdding ? (
                <div style={{
                    ...cardStyle,
                    textAlign: 'center', padding: '48px 24px',
                    border: '2px dashed rgba(139,215,199,0.3)',
                    backgroundColor: 'rgba(139,215,199,0.03)',
                }}>
                    <Baby size={32} color="#8bd7c7" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E6B4E', margin: '0 0 4px' }}>
                        No children added yet
                    </p>
                    <p style={{ fontSize: '13px', color: '#546E5C', margin: '0 0 16px' }}>
                        Add your children so connected families can learn about your household
                    </p>
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 24px', backgroundColor: '#1E6B4E', color: 'white',
                            border: 'none', borderRadius: '50px', fontWeight: 600,
                            fontSize: '14px', fontFamily: 'Comfortaa, sans-serif', cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} />
                        Add Your First Child
                    </button>
                </div>
            ) : null}
        </div>
    );
}
