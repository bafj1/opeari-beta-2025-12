import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';
import CaregiverProfileSection from './CaregiverProfileSection';
import { Camera, User, Heart, AlertCircle, HandHeart, Users, CheckCircle2, Loader2, Check } from 'lucide-react';
// import { Baby } from 'lucide-react'; // Removed unused import
import SettingsCard from './SettingsCard';
// import SettingsToggle from './SettingsToggle'; // Removed unused import

const FAMILY_INTERESTS = [
    'Playdates',
    'Outdoor adventures',
    'Arts & crafts',
    'Sports & athletics',
    'Music & dance',
    'Cooking together',
    'Reading & books',
    'STEM & science',
    'Swimming',
    'Hiking & nature',
    'Board games',
    'Weekend trips',
    'Cultural events',
    'Gardening',
    'Volunteering',
    'Language learning',
    'Pets & animals',
    'Photography',
];

interface ProfilePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function ProfilePanel({ formData, setFormData, saving, onSave }: ProfilePanelProps) {
    const { viewer } = useViewer();
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const prevSaving = useRef(saving);

    // Track saving→false transition to show "Saved" feedback
    React.useEffect(() => {
        if (prevSaving.current && !saving) {
            setSaved(true);
            const t = setTimeout(() => setSaved(false), 2500);
            return () => clearTimeout(t);
        }
        prevSaving.current = saving;
    }, [saving]);

    function titleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [roleChanged, setRoleChanged] = useState(false);
    const [pendingRole, setPendingRole] = useState<string | null>(null);

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



    // Crop modal state
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const onCropComplete = useCallback((_: any, croppedPixels: { x: number; y: number; width: number; height: number }) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

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

        // Convert to data URL and show crop modal
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        event.target.value = '';
    };

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels || !viewer?.user?.id) return;

        setUploading(true);
        try {
            // Create cropped canvas
            const canvas = document.createElement('canvas');
            const image = new Image();
            image.src = imageSrc;
            await new Promise((resolve) => { image.onload = resolve; });

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(
                image,
                croppedAreaPixels.x, croppedAreaPixels.y,
                croppedAreaPixels.width, croppedAreaPixels.height,
                0, 0,
                croppedAreaPixels.width, croppedAreaPixels.height
            );

            // Convert to blob and upload
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (!blob) throw new Error('Failed to create cropped image');

            const croppedFile = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
            const fileName = `${viewer.user.id}/${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData({ ...formData, avatar_url: publicUrl });

            await supabase
                .from('members')
                .update({ avatar_url: publicUrl })
                .eq('id', viewer.user.id);

            setShowCropModal(false);
            setImageSrc(null);
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
                    This changes your dashboard, what you see, and how others find you. Selecting "Caregiver" shows you families looking for care. Selecting "Parent" shows you matches and caregivers.
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
                                    if (formData.role !== option.value) {
                                        setPendingRole(option.value);
                                    }
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

                {pendingRole && pendingRole !== formData.role && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
                        <p className="text-sm text-amber-800 mb-2">
                            Switching to <span className="font-bold">{pendingRole === 'parent' ? 'Parent' : pendingRole === 'caregiver' ? 'Caregiver' : 'Both'}</span> will change your dashboard experience.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, role: pendingRole });
                                    setPendingRole(null);
                                    setRoleChanged(true);
                                    setTimeout(() => setRoleChanged(false), 3000);
                                }}
                                className="px-4 py-1.5 bg-[#1e6b4e] text-white text-sm rounded-full font-semibold hover:bg-[#155a3e] transition-colors"
                            >
                                Confirm
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingRole(null)}
                                className="px-4 py-1.5 border border-[#8bd7c7]/30 text-[#546E5C] text-sm rounded-full font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
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

            {/* CROP MODAL */}
            {showCropModal && imageSrc && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 16,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 24,
                        width: '100%', maxWidth: 440, fontFamily: 'Comfortaa, cursive',
                    }}>
                        <h3 style={{ color: '#1E6B4E', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
                            Adjust Photo
                        </h3>
                        <div style={{ position: 'relative', width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', background: '#f5f5f5' }}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, color: '#6b7f76' }}>Zoom</span>
                            <input
                                type="range" min={1} max={3} step={0.1} value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                style={{ flex: 1 }}
                            />
                        </div>
                        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => { setShowCropModal(false); setImageSrc(null); }}
                                style={{
                                    padding: '8px 20px', borderRadius: 20, border: '1px solid #d8f5e5',
                                    background: 'none', fontFamily: 'Comfortaa, cursive', fontSize: 13,
                                    cursor: 'pointer', color: '#6b7f76',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropSave}
                                disabled={uploading}
                                style={{
                                    padding: '8px 20px', borderRadius: 20, border: 'none',
                                    background: '#1E6B4E', color: '#fff', fontFamily: 'Comfortaa, cursive',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    opacity: uploading ? 0.6 : 1,
                                }}
                            >
                                {uploading ? 'Saving...' : 'Save Photo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    {titleCase(lang)}
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
                            ].filter(l => !(formData.languages || []).some((existing: string) => existing.toLowerCase() === l.toLowerCase()))
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

            {/* SECTION 5B: INTERESTS & ACTIVITIES */}
            {viewer?.member?.role !== 'caregiver' && (
                <div className="bg-white rounded-[20px] p-6 border-2 border-[#8bd7c7]/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-5 h-5 text-[#1e6b4e]" />
                        <h3 className="text-lg font-bold text-[#1e6b4e]">Interests & Activities</h3>
                    </div>
                    <p className="text-sm text-[#546E5C] mb-4">
                        What does your family enjoy? Shared interests help us connect you with like-minded families.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {FAMILY_INTERESTS.map(interest => {
                            const current = formData.interests || formData.support_offered || [];
                            const isSelected = current.includes(interest);
                            return (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => {
                                        const updated = isSelected
                                            ? current.filter((s: string) => s !== interest)
                                            : [...current, interest];
                                        setFormData({ ...formData, interests: updated, support_offered: updated });
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${isSelected
                                        ? 'bg-[#d8f5e5] border-[#8bd7c7] text-[#1e6b4e] font-semibold'
                                        : 'bg-white border-[#8bd7c7]/20 text-[#546E5C] hover:border-[#8bd7c7]/50'
                                        }`}
                                >
                                    {interest}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

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

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-2 -mx-1 px-1 border-t border-[#8bd7c7]/10">
                <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full py-3 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#174f3a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Comfortaa, sans-serif' }}
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
                        'Save Profile'
                    )}
                </button>
            </div>

        </form>
    );
}
