import { useState } from 'react';
import { User, Lock, Download, Trash2, LogOut, Mail, Phone, CheckCircle, Loader2, CheckCircle2, Check } from 'lucide-react';
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
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Sign out state
    const [signingOut, setSigningOut] = useState(false);

    // ---- HANDLERS ----

    const getPasswordStrength = (password: string): { level: string; color: string; width: string } => {
        if (password.length === 0) return { level: '', color: '', width: '0%' };
        if (password.length < 8) return { level: 'Too short', color: 'bg-red-400', width: '20%' };

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { level: 'Weak', color: 'bg-red-400', width: '40%' };
        if (score <= 3) return { level: 'Fair', color: 'bg-amber-400', width: '60%' };
        if (score <= 4) return { level: 'Good', color: 'bg-[#8bd7c7]', width: '80%' };
        return { level: 'Strong', color: 'bg-[#1e6b4e]', width: '100%' };
    };

    const handleUpdatePassword = async () => {
        setPasswordError('');
        setPasswordSuccess(false);

        if (!currentPassword) {
            setPasswordError('Please enter your current password.');
            return;
        }
        if (!newPassword || !confirmPassword) {
            setPasswordError('Please fill in all password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters.');
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordError('New password must be different from current password.');
            return;
        }

        setPasswordSaving(true);
        try {
            // Step 1: Verify current password by re-authenticating
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error('No user email found');

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                setPasswordError('Current password is incorrect.');
                setPasswordSaving(false);
                return;
            }

            // Step 2: Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) throw updateError;

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 5000);
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to update password.');
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
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Enter current password"
                            style={inputStyle}
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (!user?.email) return;
                                    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                        redirectTo: `${window.location.origin}/update-password`,
                                    });
                                    if (error) throw error;
                                    setForgotPasswordSent(true);
                                    setTimeout(() => setForgotPasswordSent(false), 10000);
                                } catch (err) {
                                    console.error('Error sending reset email:', err);
                                }
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px 0',
                                marginTop: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#1E6B4E',
                                cursor: 'pointer',
                                fontFamily: 'Comfortaa, sans-serif',
                                textDecoration: 'none',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                            Forgot your password?
                        </button>
                        {forgotPasswordSent && (
                            <div style={{
                                marginTop: '8px',
                                padding: '10px 14px',
                                backgroundColor: 'rgba(139,215,199,0.15)',
                                border: '1px solid rgba(139,215,199,0.4)',
                                borderRadius: '12px',
                                fontSize: '13px',
                                color: '#1E6B4E',
                                fontWeight: 500,
                            }}>
                                Password reset email sent. Check your inbox.
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E6B4E', marginBottom: '6px' }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Enter new password"
                            style={inputStyle}
                        />
                        {newPassword.length > 0 && (
                            <div className="mt-2">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getPasswordStrength(newPassword).color} rounded-full transition-all duration-300`}
                                        style={{ width: getPasswordStrength(newPassword).width }}
                                    />
                                </div>
                                <p className={`text-xs mt-1 ${getPasswordStrength(newPassword).level === 'Strong' || getPasswordStrength(newPassword).level === 'Good' ? 'text-[#1e6b4e]' :
                                    getPasswordStrength(newPassword).level === 'Fair' ? 'text-amber-600' : 'text-red-500'
                                    }`}>
                                    {getPasswordStrength(newPassword).level}
                                </p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E6B4E', marginBottom: '6px' }}>
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Confirm new password"
                            style={inputStyle}
                        />
                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                        {confirmPassword.length > 0 && newPassword === confirmPassword && (
                            <p className="text-xs text-[#1e6b4e] mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Passwords match
                            </p>
                        )}
                    </div>

                    {passwordError && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(224,122,95,0.1)',
                            color: '#E07A5F',
                            fontSize: '13px',
                            fontWeight: 500,
                        }}>
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="mt-3 p-3 bg-[#d8f5e5] rounded-xl text-sm text-[#1e6b4e] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            Password updated successfully.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                        <button
                            onClick={handleUpdatePassword}
                            disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || passwordSaving}
                            style={{
                                ...buttonPrimaryStyle,
                                opacity: (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || passwordSaving) ? 0.5 : 1,
                                cursor: (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || passwordSaving) ? 'not-allowed' : 'pointer',
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
