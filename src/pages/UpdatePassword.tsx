import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isRecoverySession, setIsRecoverySession] = useState(false);
    const [checking, setChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Listen for the PASSWORD_RECOVERY event from Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, _session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setIsRecoverySession(true);
                    setChecking(false);
                } else if (event === 'SIGNED_IN' && !isRecoverySession) {
                    // Check URL hash for recovery type
                    const hashParams = new URLSearchParams(
                        window.location.hash.substring(1)
                    );
                    if (hashParams.get('type') === 'recovery') {
                        setIsRecoverySession(true);
                        setChecking(false);
                    } else {
                        // Not a recovery session, check if we were redirected here
                        // with a recovery token in the URL
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('type') === 'recovery') {
                            setIsRecoverySession(true);
                            setChecking(false);
                        } else {
                            // Genuinely not a recovery — redirect away
                            setChecking(false);
                        }
                    }
                }
            }
        );

        // Fallback: if no event fires within 3 seconds, check current session
        const timeout = setTimeout(() => {
            if (checking) {
                // Check if there's an active session (user might already be authenticated via recovery)
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        // User has a session — assume recovery since they're on this page
                        setIsRecoverySession(true);
                    }
                    setChecking(false);
                });
            }
        }, 3000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                // Handle the "same password" error gracefully
                if (updateError.message?.includes('same') || updateError.message?.includes('different')) {
                    setError('Please choose a password you haven\'t used before.');
                } else {
                    setError(updateError.message || 'Failed to update password. Please try again.');
                }
                return;
            }

            setSuccess(true);

            // Redirect to dashboard after a moment
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Loading state while checking for recovery session
    if (checking) {
        return (
            <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                <Helmet>
                    <title>Update Password | Opeari</title>
                </Helmet>
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-[#1e6b4e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#546E5C] text-sm">Verifying your reset link...</p>
                </div>
            </div>
        );
    }

    // Not a recovery session
    if (!isRecoverySession && !success) {
        return (
            <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center px-4" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                <Helmet>
                    <title>Invalid Link | Opeari</title>
                </Helmet>
                <div className="w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-[#1e6b4e] mb-4">Invalid Reset Link</h1>
                    <p className="text-[#546E5C] mb-6">
                        This link has expired or is invalid. Please request a new password reset.
                    </p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="px-6 py-3 bg-[#1e6b4e] text-white rounded-full font-semibold hover:bg-[#155a3e] transition-colors"
                    >
                        Request New Reset Link
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center px-4" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                <Helmet>
                    <title>Password Updated | Opeari</title>
                </Helmet>
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[#1e6b4e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1e6b4e] mb-2">Password Updated</h1>
                    <p className="text-[#546E5C] mb-6">
                        Your password has been changed successfully. Taking you to your village...
                    </p>
                    <div className="w-8 h-8 border-3 border-[#8bd7c7] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    // Password update form
    return (
        <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center px-4" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
            <Helmet>
                <title>Set New Password | Opeari</title>
            </Helmet>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#1e6b4e] mb-2">Set Your New Password</h1>
                    <p className="text-[#546E5C] text-sm">
                        Choose a strong password for your Opeari account.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdatePassword} className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
                    {/* New Password */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-[#1e6b4e] mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#546E5C] text-xs font-medium hover:text-[#1e6b4e]"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-[#1e6b4e] mb-2">
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            minLength={8}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !password || !confirmPassword}
                        className="w-full py-3 bg-[#1e6b4e] text-white rounded-full font-semibold hover:bg-[#155a3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                {/* Back to login */}
                <p className="text-center text-sm text-[#546E5C] mt-6">
                    Remember your password?{' '}
                    <a href="/login" className="text-[#1e6b4e] font-semibold hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
