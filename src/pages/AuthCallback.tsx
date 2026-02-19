import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const next = searchParams.get('next') || '/village';

        // 1. Listen for auth state changes (this catches the hash processing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Auth succeeded — redirect
                // specific check for password recovery which might fire SIGNED_IN first in some flows
                const isRecovery = searchParams.get('type') === 'recovery';
                if (isRecovery) {
                    navigate('/update-password', { replace: true });
                } else {
                    navigate(next, { replace: true });
                }
            } else if (event === 'PASSWORD_RECOVERY') {
                // Explicit password recovery event
                navigate('/update-password', { replace: true });
            }
        });

        // 2. Fallback: if already signed in (race condition), redirect immediately
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const isRecovery = searchParams.get('type') === 'recovery';
                if (isRecovery) {
                    navigate('/update-password', { replace: true });
                } else {
                    navigate(next, { replace: true });
                }
            }
        };

        // Small delay to let Supabase process the token hash if present
        // (Supabase client auto-detects hash in URL and processes it)
        const checkTimer = setTimeout(checkSession, 1500);

        // 3. Timeout: if nothing happens after 10 seconds, show error
        const errorTimer = setTimeout(() => {
            setError('This link may have expired or is invalid. Please request a new one.');
        }, 10000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(checkTimer);
            clearTimeout(errorTimer);
        };
    }, [navigate, searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffaf5] text-[#1e6b4e] font-[Comfortaa]">
                <div className="text-center p-8 bg-white rounded-3xl shadow-card border border-[#1e6b4e]/10 max-w-sm mx-4">
                    <h2 className="text-xl font-bold mb-2 text-[#1e6b4e]">Verification Issue</h2>
                    <p className="text-[#546E5C] mb-6 text-sm">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-[#1e6b4e] text-white rounded-full font-semibold text-sm hover:bg-[#155a3e] transition-colors w-full"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fffaf5]">
            <div className="animate-pulse flex flex-col items-center">
                <img src="/logo.svg" className="w-16 h-16 mb-4" alt="Opeari" />
                <div className="flex items-center gap-3 text-[#1e6b4e]">
                    <div className="w-2 h-2 bg-[#1e6b4e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#1e6b4e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#1e6b4e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-[#1e6b4e] font-bold mt-4 text-sm tracking-wide uppercase">Verifying your link</p>
            </div>
        </div>
    );
}
