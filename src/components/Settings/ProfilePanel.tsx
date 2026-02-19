import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';
import CaregiverProfileSection from './CaregiverProfileSection';
import { Camera, User, Heart, AlertCircle, Lock, HandHeart, Users, CheckCircle2 } from 'lucide-react'; // Shield, CheckCircle, Phone removed
// import { Baby } from 'lucide-react'; // Removed unused import
import SettingsCard from './SettingsCard';
// import SettingsToggle from './SettingsToggle'; // Removed unused import

interface ProfilePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function ProfilePanel({ formData, setFormData, saving, onSave }: ProfilePanelProps) {
    const { viewer } = useViewer();
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [roleChanged, setRoleChanged] = useState(false);

    // Styles
    const inputClass = "w-full p-3.5 rounded-xl border-[1.5px] border-opeari-mint/40 bg-white text-opeari-text-body text-sm font-comfortaa focus:outline-none focus:border-opeari-green transition-all duration-200 placeholder:text-opeari-text-secondary/50";
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-1.5";

    // Formatters
    const formatUSPhone = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 10);
        if (!digits) return '';
        const area = digits.slice(0, 3);
        const prefix = digits.slice(3, 6);
        const line = digits.slice(6, 10);

        if (digits.length <= 3) return area;
        if (digits.length <= 6) return `(${area}) ${prefix}`;
        return `(${area}) ${prefix}-${line}`;
    };

    const formatZipCode = (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        if (digits.length <= 5) return digits;
        return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
    };

    // Options
    const ROLE_OPTIONS = [
        {
            value: 'parent',
            label: 'Parent',
            subtitle: 'Looking for care',
            icon: User,
            selectedBorder: '#1E6B4E',
            selectedBg: 'rgba(139, 215, 199, 0.15)',
            selectedColor: '#1E6B4E',
        },
        {
            value: 'caregiver',
            label: 'Caregiver',
            subtitle: 'Providing care',
            icon: HandHeart,
            selectedBorder: '#E07A5F',
            selectedBg: 'rgba(248, 195, 179, 0.2)',
            selectedColor: '#E07A5F',
        },
        {
            value: 'both',
            label: 'Both',
            subtitle: 'Share & receive care',
            icon: Users,
            selectedBorder: '#8bd7c7',
            selectedBg: 'rgba(139, 215, 199, 0.15)',
            selectedColor: '#1E6B4E',
        },
    ];



    const PREFERENCES = [
        { key: 'comfortable_with_pets', label: 'Comfortable with pets', desc: 'Dogs, cats, or other pets in the home' },
        { key: 'smoke_free_required', label: 'Smoke-free environment required', desc: 'No smoking in home or around children' },
        { key: 'transportation_required', label: 'Own transportation', desc: 'Has reliable vehicle and valid license' },
        { key: 'willing_to_travel', label: 'Willing to travel to families', desc: 'Can commute to different locations' },
        { key: 'available_overnight', label: 'Available for overnight care', desc: 'Can provide overnight or extended care' },
    ];

    const PRIVACY_SETTINGS = [
        { key: 'privacy_show_full_name', label: 'Show full name', desc: 'Display your full name on your profile' },
        { key: 'privacy_show_location', label: 'Show precise location', desc: 'Show exact address vs general area only' },
        { key: 'privacy_show_phone', label: 'Show phone number', desc: 'Allow matches to see your phone number' },
        { key: 'privacy_appear_in_search', label: 'Appear in search results', desc: 'Allow others to find and match with you' },
    ];

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !viewer?.user?.id) return;

        // Validate
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a JPG, PNG, WebP, or GIF image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            // CRITICAL: Must use userId folder for RLS policy
            const fileName = `${viewer.user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update both local state and database immediately for feedback, though Save also persists it
            setFormData({ ...formData, avatar_url: publicUrl });

            await supabase
                .from('members')
                .update({ avatar_url: publicUrl })
                .eq('id', viewer.user.id);

        } catch (err) {
            console.error('Photo upload failed:', err);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-8 animate-fade-in max-w-4xl">

            {/* SECTION 1: ROLE SELECTOR */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-1">
                    I Am A
                </h3>
                <p className="text-xs text-[#546E5C] mb-3">
                    This determines your dashboard experience and how you appear to others.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ROLE_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const isSelected = formData.role === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, role: option.value });
                                    setRoleChanged(true);
                                    setTimeout(() => setRoleChanged(false), 3000);
                                }}
                                className="text-left flex flex-col justify-between h-full group relative"
                                style={{
                                    border: isSelected ? `2px solid ${option.selectedBorder}` : '1.5px solid rgba(139, 215, 199, 0.4)',
                                    backgroundColor: isSelected ? option.selectedBg : 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.borderColor = '#8bd7c7';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.borderColor = 'rgba(139, 215, 199, 0.4)';
                                }}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#1e6b4e]" />
                                    </div>
                                )}
                                <div className="mb-3">
                                    <Icon
                                        size={24}
                                        color={isSelected ? option.selectedColor : '#9CA3AF'}
                                        style={{ transition: 'color 0.2s' }}
                                    />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            color: isSelected ? option.selectedColor : '#374151',
                                            fontWeight: 700,
                                            fontSize: '16px',
                                            marginBottom: '4px',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        {option.label}
                                    </div>
                                    <div
                                        style={{
                                            color: isSelected ? option.selectedColor : '#6B7280',
                                            fontSize: '13px',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        {option.subtitle}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {roleChanged && (
                    <p className="text-xs text-[#1e6b4e] mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Role updated — save your profile to apply.
                    </p>
                )}
            </div>

            {/* SECTION 2: PROFILE PHOTO */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-opeari-mint/20">
                <div className="relative group shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-opeari-mint/10 flex items-center justify-center relative">
                        {formData.avatar_url ? (
                            <img
                                src={formData.avatar_url}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-12 h-12 text-opeari-mint" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-opeari-green text-white rounded-full flex items-center justify-center shadow hover:bg-opeari-green-dark transition-colors"
                    >
                        <Camera size={14} />
                    </button>
                </div>

                <div className="text-center sm:text-left space-y-2">
                    <h3 className="text-opeari-heading font-bold text-lg">Profile Photo</h3>
                    <p className="text-sm text-opeari-text-secondary max-w-xs">
                        Profiles with photos get 5x more matches! Upload a clear photo of yourself.
                    </p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#1E6B4E',
                            padding: '8px 18px',
                            borderRadius: '10px',
                            border: '1.5px solid #1E6B4E',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontFamily: 'Comfortaa, sans-serif',
                            marginTop: '8px',
                        }}
                    >
                        Upload Photo
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                    />
                </div>
            </div>

            {/* SECTION 3: BASIC INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                {/* Row 1: Name */}
                <div className="col-span-1">
                    <label className={labelClass}>First Name</label>
                    <input
                        type="text"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className={inputClass}
                    />
                </div>
                <div className="col-span-1">
                    <label className={labelClass}>Last Name</label>
                    <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className={inputClass}
                    />
                </div>

                {/* Row 2: Phone */}
                <div className="col-span-1 md:col-span-2">
                    <label className={labelClass}>Phone Number</label>
                    <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formatUSPhone(formData.phone || '')}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData({ ...formData, phone: digits });
                        }}
                        className={inputClass}
                        placeholder="(555) 123-4567"
                    />
                </div>

                {/* Row 3: Address */}
                <div className="col-span-1">
                    <label className={labelClass}>Zip Code</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={formatZipCode(formData.zip_code || '')}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setFormData({ ...formData, zip_code: digits });
                        }}
                        className={inputClass}
                        placeholder="e.g. 90210"
                    />
                </div>
                <div className="col-span-1">
                    <label className={labelClass}>Neighborhood</label>
                    <input
                        type="text"
                        value={formData.neighborhood || ''}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. Noe Valley"
                    />
                </div>

                {/* Row 4: Languages */}
                <div className="col-span-1 md:col-span-2">
                    <label style={{
                        fontSize: '12px', fontWeight: 600, color: '#1E6B4E',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'block', marginBottom: '8px',
                    }}>
                        Languages Spoken
                    </label>

                    {/* Selected languages as removable tags */}
                    {(formData.languages || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            {(formData.languages || []).map((lang: string) => (
                                <span key={lang} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(139, 215, 199, 0.2)',
                                    color: '#1E6B4E',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                }}>
                                    {lang}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = (formData.languages || []).filter((l: string) => l !== lang);
                                            setFormData({ ...formData, languages: updated });
                                        }}
                                        style={{ cursor: 'pointer', fontSize: '14px', lineHeight: 1, color: '#6B7280', border: 'none', background: 'none', padding: 0 }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Dropdown to add languages */}
                    <div className="relative">
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value && !(formData.languages || []).includes(e.target.value)) {
                                    setFormData({
                                        ...formData,
                                        languages: [...(formData.languages || []), e.target.value],
                                    });
                                }
                            }}
                            className="focus:!border-[#8bd7c7] transition-colors"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1.5px solid rgba(139, 215, 199, 0.4)',
                                fontSize: '14px',
                                fontFamily: 'Comfortaa, sans-serif',
                                color: '#6B7280',
                                backgroundColor: 'white',
                                outline: 'none',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236B7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                backgroundSize: '16px',
                            }}
                        >
                            <option value="">+ Add a language...</option>
                            {[
                                'English', 'Spanish', 'Mandarin', 'Cantonese',
                                'Korean', 'Japanese', 'Vietnamese', 'Tagalog',
                                'Hindi', 'Arabic', 'French', 'Portuguese',
                                'Russian', 'German', 'Italian', 'Hebrew',
                            ].filter(l => !(formData.languages || []).includes(l))
                                .map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Row 5: Children Age Groups - REMOVED */}

                {/* Row 6: Bio */}
                <div className="col-span-1 md:col-span-2">
                    <label className={labelClass}>Bio / Introduction</label>
                    <textarea
                        value={formData.bio || ''}
                        onChange={(e) => {
                            // Limit to 500 characters
                            const value = e.target.value.slice(0, 500);
                            setFormData({ ...formData, bio: value });
                        }}
                        rows={5}
                        className={inputClass}
                        placeholder="Tell your neighbors a bit about yourself..."
                        maxLength={500}
                    />
                    <div className="flex justify-end mt-1">
                        <span className={`text-xs ${(formData.bio || '').length >= 450 ? 'text-[#E07A5F]' : 'text-opeari-text-secondary/70'}`}>
                            {(formData.bio || '').length}/500 characters
                        </span>
                    </div>
                </div>
            </div>

            {/* SECTION 4: EMERGENCY CONTACT */}
            <SettingsCard title="Emergency Contact" description="This information is kept private and only used in case of emergency." icon={AlertCircle}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <div className="col-span-1">
                        <label className={labelClass}>Contact Name</label>
                        <input
                            type="text"
                            value={formData.emergency_contact_name || ''}
                            onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                            className={inputClass}
                            placeholder="Full Name"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Relationship</label>
                        <input
                            type="text"
                            value={formData.emergency_contact_relationship || ''}
                            onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                            className={inputClass}
                            placeholder="Spouse, etc."
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className={labelClass}>Phone Number</label>
                        <input
                            type="tel"
                            value={formatUSPhone(formData.emergency_contact_phone || '')}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setFormData({ ...formData, emergency_contact_phone: digits });
                            }}
                            className={inputClass}
                            placeholder="(555) 123-4567"
                        />
                    </div>
                </div>
            </SettingsCard>

            {/* SECTION 5: PREFERENCES */}
            <SettingsCard title="Preferences & Requirements" icon={Heart}>
                <div className="space-y-3">
                    {PREFERENCES.map(pref => {
                        const isOn = !!formData[pref.key];
                        return (
                            <button
                                key={pref.key}
                                type="button"
                                onClick={() => setFormData({ ...formData, [pref.key]: !isOn })}
                                style={{
                                    border: isOn ? '2px solid #1E6B4E' : '1.5px solid rgba(139, 215, 199, 0.4)',
                                    backgroundColor: isOn ? 'rgba(139, 215, 199, 0.15)' : 'white',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    fontFamily: 'Comfortaa, sans-serif',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: isOn ? '#1E6B4E' : '#374151' }}>
                                        {isOn ? '✓ ' : ''}{pref.label}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{pref.desc}</div>
                                </div>
                                {/* Toggle circle indicator */}
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    border: isOn ? 'none' : '2px solid #D1D5DB',
                                    backgroundColor: isOn ? '#1E6B4E' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {isOn && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </SettingsCard>

            {/* SECTION 6: TRUST & SAFETY */}
            {/* SECTION 6: TRUST & SAFETY */}
            <div style={{
                border: '1.5px solid rgba(139, 215, 199, 0.4)',
                borderRadius: '16px',
                padding: '24px',
                backgroundColor: 'white',
            }}>
                <div style={{ marginBottom: '8px' }}>
                    <h3 style={{
                        fontSize: '16px', fontWeight: 700, color: '#1E6B4E',
                        margin: '0 0 4px 0', fontFamily: 'Comfortaa, sans-serif',
                    }}>
                        Trust & Safety
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                        Verified profiles build trust and get 3x more matches.
                    </p>
                </div>

                <div className="flex flex-col">
                    {[
                        {
                            label: 'Email Verification',
                            verified: true, // Email is verified if they are logged in
                            action: null,
                        },
                        {
                            label: 'Phone Verification',
                            verified: viewer?.member?.phone_verified || false,
                            action: 'Verify',
                            actionDisabled: true,
                        },
                        {
                            label: 'Background Check',
                            verified: viewer?.member?.vetting_status === 'approved',
                            action: 'Start',
                            actionDisabled: true,
                        },
                    ].map((item, i, arr) => (
                        <div key={item.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 0',
                            borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Status icon */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    backgroundColor: item.verified ? 'rgba(30, 107, 78, 0.1)' : '#F9FAFB',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {item.verified ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E6B4E" stroke="none">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{item.label}</div>
                                    <div style={{ fontSize: '12px', color: item.verified ? '#1E6B4E' : '#9CA3AF', marginTop: '1px' }}>
                                        {item.verified ? 'Verified' : 'Not verified'}
                                    </div>
                                </div>
                            </div>

                            {/* Action button */}
                            {!item.verified && item.action && (
                                <div style={{ textAlign: 'right' }}>
                                    <button
                                        type="button"
                                        disabled={item.actionDisabled}
                                        style={{
                                            backgroundColor: item.actionDisabled ? 'transparent' : '#8bd7c7',
                                            color: item.actionDisabled ? '#9CA3AF' : '#1E6B4E',
                                            border: item.actionDisabled ? '1.5px solid #D1D5DB' : 'none',
                                            padding: '6px 16px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: item.actionDisabled ? 'default' : 'pointer',
                                            fontFamily: 'Comfortaa, sans-serif',
                                        }}
                                    >
                                        {item.action}
                                    </button>
                                    {item.actionDisabled && (
                                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Coming soon</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 7: PRIVACY SETTINGS */}
            <SettingsCard title="Privacy Settings" description="Control what information is visible to other members." icon={Lock}>
                <div className="space-y-3">
                    {PRIVACY_SETTINGS.map(pref => {
                        const isOn = formData[pref.key] ?? true; // Default to true if undefined, except phone which might be false by default in logic but here we just render
                        return (
                            <button
                                key={pref.key}
                                type="button"
                                onClick={() => setFormData({ ...formData, [pref.key]: !isOn })}
                                style={{
                                    border: isOn ? '2px solid #1E6B4E' : '1.5px solid rgba(139, 215, 199, 0.4)',
                                    backgroundColor: isOn ? 'rgba(139, 215, 199, 0.15)' : 'white',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    fontFamily: 'Comfortaa, sans-serif',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: isOn ? '#1E6B4E' : '#374151' }}>
                                        {pref.label}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{pref.desc}</div>
                                </div>
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    border: isOn ? 'none' : '2px solid #D1D5DB',
                                    backgroundColor: isOn ? '#1E6B4E' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {isOn && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </SettingsCard>

            {/* SECTION 8: SOCIAL CONNECTIONS */}
            <div style={{
                border: '1.5px solid rgba(139, 215, 199, 0.4)',
                borderRadius: '16px',
                padding: '24px',
                backgroundColor: 'white',
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{
                        fontSize: '16px', fontWeight: 700, color: '#1E6B4E',
                        margin: '0 0 4px 0', fontFamily: 'Comfortaa, sans-serif',
                    }}>
                        Social Connections (Optional)
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className={labelClass}>Instagram Handle</label>
                        <input
                            type="text"
                            value={formData.instagram_handle || ''}
                            onChange={(e) => {
                                // Strip URL parts and @
                                let handle = e.target.value;
                                handle = handle.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '');
                                handle = handle.replace(/^@/, '');
                                // Remove unwanted chars (basic handle validation)
                                handle = handle.replace(/[^a-zA-Z0-9_.]/g, '');
                                setFormData({ ...formData, instagram_handle: handle });
                            }}
                            className={inputClass}
                            placeholder="your.username"
                        />
                        {formData.instagram_handle && (
                            <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                                instagram.com/{formData.instagram_handle}
                            </span>
                        )}
                    </div>

                    <div className="col-span-1">
                        <label className={labelClass}>LinkedIn URL</label>
                        <input
                            type="text"
                            value={formData.linkedin_handle || ''}
                            onChange={(e) => {
                                let val = e.target.value;
                                // Simple strip if they paste a URL
                                val = val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '');
                                setFormData({ ...formData, linkedin_handle: val });
                            }}
                            className={inputClass}
                            placeholder="your.username"
                        />
                        {formData.linkedin_handle && (
                            <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                                linkedin.com/in/{formData.linkedin_handle}
                            </span>
                        )}
                    </div>

                    <div className="col-span-1">
                        <label className={labelClass}>Facebook URL</label>
                        <input
                            type="text"
                            value={formData.facebook_handle || ''}
                            onChange={(e) => {
                                let val = e.target.value;
                                // Simple strip if they paste a URL
                                val = val.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '');
                                setFormData({ ...formData, facebook_handle: val });
                            }}
                            className={inputClass}
                            placeholder="your.username"
                        />
                        {formData.facebook_handle && (
                            <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                                facebook.com/{formData.facebook_handle}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 9: CAREGIVER SPECIFIC PROFILE */}
            {viewer?.member?.role === 'caregiver' && <CaregiverProfileSection />}

            <div className="pt-6 flex justify-end border-t border-opeari-mint/20">
                <button
                    type="submit"
                    disabled={saving || uploading}
                    style={{
                        backgroundColor: '#1E6B4E',
                        color: 'white',
                        padding: '14px 32px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '15px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Comfortaa, sans-serif',
                        width: '100%',
                        opacity: (saving || uploading) ? 0.7 : 1,
                    }}
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>

        </form>
    );
}
