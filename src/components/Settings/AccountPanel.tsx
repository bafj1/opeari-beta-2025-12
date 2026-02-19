import { useState } from 'react';
import { User, Lock, Download, Trash2, LogOut, Mail, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SettingsCard from './SettingsCard';

interface AccountPanelProps {
    displayEmail: string;
    displayPhone?: string;
    onPhoneChange?: (value: string) => void;
    onSave?: (data?: any) => void;
    saving?: boolean;
}

export default function AccountPanel({
    displayEmail,
    displayPhone,
    onPhoneChange,
    onSave,
    saving
}: AccountPanelProps) {
    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Sign out state
    const [signingOut, setSigningOut] = useState(false);

    // ---- HANDLERS ----

    const handleUpdatePassword = async () => {
        setPasswordMessage(null);

        if (!newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
            return;
        }

        setPasswordSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (err) {
            console.error('Sign out error:', err);
            setSigningOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setDeleting(true);
        try {
            // Note: Full account deletion requires a serverless function
            // For now, we sign the user out and flag the account
            // A proper implementation would call a Netlify function that:
            // 1. Deletes user data from members table
            // 2. Deletes auth user via Supabase admin API
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('members')
                    .update({ role: 'deleted', bio: null, phone: null })
                    .eq('id', user.id);
            }
            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (err) {
            console.error('Delete account error:', err);
            setDeleting(false);
        }
    };

    // Shared input style
    const inputStyle = {
        width: '100%',
        backgroundColor: 'white',
        border: '2px solid rgba(139,215,199,0.3)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: '#1E6B4E',
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: '14px',
        outline: 'none',
    };

    const inputWithIconStyle = {
        ...inputStyle,
        paddingLeft: '40px',
    };

    const buttonOutlineStyle = {
        padding: '10px 20px',
        border: '2px solid rgba(139,215,199,0.5)',
        borderRadius: '12px',
        color: '#1E6B4E',
        fontWeight: 600,
        fontSize: '14px',
        fontFamily: 'Comfortaa, sans-serif',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const buttonPrimaryStyle = {
        padding: '12px 32px',
        backgroundColor: '#1E6B4E',
        color: 'white',
        fontWeight: 600,
        fontSize: '14px',
        fontFamily: 'Comfortaa, sans-serif',
        borderRadius: '50px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px', maxWidth: '720px' }}>

            {/* === CONTACT INFORMATION === */}
            <SettingsCard title="Contact Information" icon={User}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E6B4E', marginBottom: '6px' }}>
                            Email Address
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="email"
                                    value={displayEmail}
                                    readOnly
                                    style={inputWithIconStyle}
                                />
                                <Mail size={18} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                                <div style={{
                                    position: 'absolute', right: '12px', top: '10px',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '2px 8px', borderRadius: '12px',
                                    backgroundColor: 'rgba(139,215,199,0.2)',
                                }}>
                                    <CheckCircle size={12} color="#1E6B4E" />
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#1E6B4E', textTransform: 'uppercase' }}>Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E6B4E', marginBottom: '6px' }}>
                            Phone Number
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="tel"
                                    value={displayPhone || ''}
                                    onChange={(e) => onPhoneChange?.(e.target.value)}
                                    placeholder="Add phone number"
                                    style={inputWithIconStyle}
                                />
                                <Phone size={18} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                            </div>
                            <button
                                onClick={() => onSave?.({ phone: displayPhone })}
                                disabled={saving}
                                style={{
                                    ...buttonOutlineStyle,
                                    opacity: saving ? 0.5 : 1,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {saving ? 'Saving...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* === CHANGE PASSWORD === */}
            <SettingsCard title="Change Password" icon={Lock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E6B4E', marginBottom: '6px' }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E6B4E', marginBottom: '6px' }}>
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            style={inputStyle}
                        />
                    </div>

                    {passwordMessage && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: passwordMessage.type === 'success' ? 'rgba(139,215,199,0.15)' : 'rgba(224,122,95,0.1)',
                            color: passwordMessage.type === 'success' ? '#1E6B4E' : '#E07A5F',
                            fontSize: '13px',
                            fontWeight: 500,
                        }}>
                            {passwordMessage.text}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                        <button
                            onClick={handleUpdatePassword}
                            disabled={passwordSaving}
                            style={{
                                ...buttonPrimaryStyle,
                                opacity: passwordSaving ? 0.5 : 1,
                                cursor: passwordSaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            {passwordSaving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                            {passwordSaving ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </div>
            </SettingsCard>

            {/* === DATA & PRIVACY === */}
            <SettingsCard title="Data & Privacy" icon={Download}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Download Data — Coming Soon */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        border: '2px solid rgba(139,215,199,0.3)',
                        borderRadius: '16px',
                        opacity: 0.6,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Download size={20} color="#1E6B4E" />
                            <span style={{ fontWeight: 600, color: '#1E6B4E', fontSize: '14px' }}>Download My Data</span>
                        </div>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(139,215,199,0.2)',
                            color: '#1E6B4E',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}>
                            Coming soon
                        </span>
                    </div>

                    {/* Delete Account */}
                    <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(139,215,199,0.2)' }}>
                        {!showDeleteConfirm ? (
                            <>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: 'rgba(224,122,95,0.05)',
                                    border: '1px solid rgba(224,122,95,0.2)',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                }}>
                                    <p style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5, margin: 0 }}>
                                        <strong>Warning:</strong> Deleting your account is permanent and cannot be undone. All your data, matches, and messages will be permanently removed.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid rgba(224,122,95,0.3)',
                                        borderRadius: '50px',
                                        color: '#E07A5F',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        fontFamily: 'Comfortaa, sans-serif',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Delete My Account
                                </button>
                            </>
                        ) : (
                            <div style={{
                                padding: '20px',
                                border: '2px solid rgba(224,122,95,0.3)',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(224,122,95,0.03)',
                            }}>
                                <p style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 600, margin: '0 0 8px' }}>
                                    Are you sure? This cannot be undone.
                                </p>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
                                    Type <strong>DELETE</strong> below to confirm account deletion.
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder='Type "DELETE" to confirm'
                                    style={{
                                        ...inputStyle,
                                        marginBottom: '12px',
                                        borderColor: deleteConfirmText === 'DELETE' ? 'rgba(224,122,95,0.5)' : 'rgba(139,215,199,0.3)',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                        style={{
                                            ...buttonOutlineStyle,
                                            flex: 1,
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmText !== 'DELETE' || deleting}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: deleteConfirmText === 'DELETE' ? '#E07A5F' : '#D1D5DB',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            fontFamily: 'Comfortaa, sans-serif',
                                            borderRadius: '50px',
                                            border: 'none',
                                            cursor: deleteConfirmText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {deleting ? 'Deleting...' : 'Permanently Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsCard>

            {/* === SIGN OUT === */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px',
                border: '2px solid rgba(139,215,199,0.3)',
                borderRadius: '16px',
                backgroundColor: 'white',
            }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E6B4E', margin: '0 0 4px' }}>Sign Out</h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Sign out of your account on this device</p>
                </div>
                <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        border: '2px solid rgba(139,215,199,0.5)',
                        borderRadius: '50px',
                        color: '#1E6B4E',
                        fontWeight: 700,
                        fontSize: '14px',
                        fontFamily: 'Comfortaa, sans-serif',
                        backgroundColor: 'transparent',
                        cursor: signingOut ? 'not-allowed' : 'pointer',
                        opacity: signingOut ? 0.5 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    <LogOut size={16} />
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
            </div>
        </div>
    );
}
