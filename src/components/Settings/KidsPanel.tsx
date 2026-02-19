import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Baby, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';

interface Kid {
    id: string;
    name: string;
    birthday: string | null;
    birth_year?: number | null;
    gender: string | null;
    notes: string | null;
    display_name?: boolean;
}

const GENDER_OPTIONS = [
    { value: '', label: 'Prefer not to say' },
    { value: 'boy', label: 'Boy' },
    { value: 'girl', label: 'Girl' },
    { value: 'nonbinary', label: 'Nonbinary' },
];

export default function KidsPanel() {
    const { viewer } = useViewer();
    const [kids, setKids] = useState<Kid[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingKid, setEditingKid] = useState<Kid | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [gender, setGender] = useState('');
    const [notes, setNotes] = useState('');
    const [displayName, setDisplayName] = useState(true);

    // UI state
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setName('');
        setBirthMonth('');
        setBirthYear('');
        setGender('');
        setNotes('');
        setDisplayName(true);
        setEditingKid(null);
        setIsAdding(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewer?.user?.id || !name.trim() || !birthMonth || !birthYear) return;

        setSaving(true);
        try {
            const birthday = `${birthYear}-${birthMonth}-01`;
            const payload = {
                user_id: viewer.user.id,
                name: name.trim(),
                birthday,
                birth_year: parseInt(birthYear),
                gender: gender || null,
                notes: notes || null,
                display_name: displayName,
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
        setName(kid.name);
        setGender(kid.gender || '');
        if (kid.birthday) {
            const date = new Date(kid.birthday);
            setBirthMonth(String(date.getMonth() + 1).padStart(2, '0'));
            setBirthYear(String(date.getFullYear()));
        } else {
            setBirthMonth('');
            setBirthYear('');
        }
        setNotes(kid.notes || '');
        setDisplayName(kid.display_name !== false);
        setIsAdding(true);
    };

    const calculateAge = (birthday: string | null): string | null => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const now = new Date();
        const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
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

    const inputStyle = {
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

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: '#1E6B4E',
        marginBottom: '6px',
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: '#1E6B4E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 600,
                            fontSize: '14px',
                            fontFamily: 'Comfortaa, sans-serif',
                            cursor: 'pointer',
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
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: message.type === 'success' ? 'rgba(139,215,199,0.15)' : 'rgba(224,122,95,0.1)',
                    color: message.type === 'success' ? '#1E6B4E' : '#E07A5F',
                    fontSize: '13px',
                    fontWeight: 500,
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

                        {/* Name */}
                        <div>
                            <label style={labelStyle}>Name</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="First name"
                                style={inputStyle}
                            />
                        </div>

                        {/* Birthday (Month + Year) + Gender */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Birth Month</label>
                                <select
                                    required
                                    value={birthMonth}
                                    onChange={e => setBirthMonth(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="">Month</option>
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                        .map((m, i) => (
                                            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Birth Year</label>
                                <select
                                    required
                                    value={birthYear}
                                    onChange={e => setBirthYear(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="">Year</option>
                                    {Array.from({ length: 18 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Gender (optional)</label>
                                <select
                                    value={gender}
                                    onChange={e => setGender(e.target.value)}
                                    style={inputStyle}
                                >
                                    {GENDER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label style={labelStyle}>Notes (optional)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Allergies, personality, special needs, favorite activities..."
                                rows={3}
                            />
                        </div>

                        {/* Display Name Toggle */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <div>
                                <p className="text-sm font-medium text-[#1e6b4e]">Show name on profile</p>
                                <p className="text-xs text-[#546E5C]">Others will see "{name ? name[0] : 'C'}." instead of the full name</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDisplayName(!displayName)}
                                className={`relative w-10 h-6 rounded-full transition-colors ${displayName ? 'bg-[#1e6b4e]' : 'bg-gray-300'
                                    }`}
                                aria-label={`Toggle name display`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${displayName ? 'translate-x-[18px]' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: '10px 20px',
                                    border: '2px solid rgba(139,215,199,0.5)',
                                    borderRadius: '50px',
                                    color: '#1E6B4E',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    fontFamily: 'Comfortaa, sans-serif',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !name.trim() || !birthMonth || !birthYear}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 24px',
                                    backgroundColor: '#1E6B4E',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: (saving || !name.trim() || !birthMonth || !birthYear) ? 0.5 : 1,
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
                        const age = calculateAge(kid.birthday);
                        const gc = genderColors[kid.gender || 'default'] || genderColors.default;

                        return (
                            <div
                                key={kid.id}
                                style={{
                                    ...cardStyle,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px 20px',
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: gc.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: '20px', fontWeight: 700, color: gc.text }}>
                                        {kid.name ? kid.name.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E6B4E' }}>
                                            {kid.display_name !== false ? kid.name : `${kid.name.charAt(0).toUpperCase()}.`}
                                        </span>
                                        {age && (
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                backgroundColor: gc.bg,
                                                color: gc.text,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                            }}>
                                                {age}
                                            </span>
                                        )}
                                        {kid.gender && (
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                backgroundColor: gc.bg,
                                                color: gc.text,
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                            }}>
                                                {kid.gender}
                                            </span>
                                        )}
                                    </div>
                                    {kid.notes && (
                                        <p style={{
                                            fontSize: '13px',
                                            color: '#546E5C',
                                            marginTop: '4px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
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
                                            padding: '8px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            color: '#546E5C',
                                        }}
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(kid.id)}
                                        style={{
                                            padding: '8px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            color: '#546E5C',
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
                    textAlign: 'center',
                    padding: '48px 24px',
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 24px',
                            backgroundColor: '#1E6B4E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 600,
                            fontSize: '14px',
                            fontFamily: 'Comfortaa, sans-serif',
                            cursor: 'pointer',
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
