import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { EmailOtpType } from '@supabase/supabase-js';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            const token_hash = searchParams.get('token_hash');
            const type = searchParams.get('type') as EmailOtpType | null;
            // The next param might be provided by the link generation options
            const next = searchParams.get('next') || '/dashboard';

            if (token_hash && type) {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash,
                    type,
                });

                if (!error) {
                    // Redirect to the intended page (e.g., onboarding or dashboard)
                    navigate(next);
                } else {
                    console.error('Auth verification error:', error);
                    setError(error.message);
                    // Optionally redirect to login after a delay
                    setTimeout(() => navigate('/signin'), 3000);
                }
            } else {
                // Fallback: If no token_hash, maybe looking for a session in URL fragment (Implicit flow)
                // But typically this route is for PKCE token exchange.
                // If we land here without params, maybe just redirect home or check session.
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    navigate(next);
                } else {
                    navigate('/signin');
                }
            }
        };

        handleAuth();
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffaf5] text-opeari-heading font-[Comfortaa]">
                <div className="text-center p-8 bg-white rounded-3xl shadow-card">
                    <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-400">Redirecting to sign in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fffaf5]">
            <div className="animate-pulse flex flex-col items-center">
                <img src="/logo.svg" className="w-16 h-16 mb-4" alt="Opeari" />
                <p className="text-[#1e6b4e] font-bold">Verifying your link...</p>
            </div>
        </div>
    );
}
