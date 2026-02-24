import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const next = searchParams.get('next') || '/village';
        const isRecovery = searchParams.get('type') === 'recovery';
        const destination = isRecovery ? '/update-password' : next;

        let timeout: ReturnType<typeof setTimeout>;

        const handleAuth = async () => {
            // The Supabase JS client automatically detects #access_token in the URL
            // and processes it. We need to wait for that to complete.

            // First, check if there's already a session (e.g., from a previous sign-in)
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Session exists — redirect immediately using window.location
                // (not React Router, to ensure a full page load with clean state)
                window.location.replace(destination);
                return;
            }

            // No session yet — the hash token might still be processing.
            // Listen for the auth state change.
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    subscription.unsubscribe();
                    window.location.replace(destination);
                } else if (event === 'PASSWORD_RECOVERY') {
                    subscription.unsubscribe();
                    window.location.replace('/update-password');
                }
            });

            // Fallback: check session again after a delay (race condition safety net)
            timeout = setTimeout(async () => {
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                if (retrySession) {
                    subscription.unsubscribe();
                    window.location.replace(destination);
                } else {
                    subscription.unsubscribe();
                    setError('This link may have expired or is invalid. Please request a new one.');
                }
            }, 5000);
        };

        handleAuth();

        return () => {
            clearTimeout(timeout);
        };
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffaf5] text-[#1e6b4e] font-[Comfortaa]">
                <div className="text-center p-8 bg-white rounded-3xl shadow-card border border-[#1e6b4e]/10 max-w-sm mx-4">
                    <h2 className="text-xl font-bold mb-2 text-[#1e6b4e]">Verification Issue</h2>
                    <p className="text-[#546E5C] mb-6 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
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
                <img src="/icon.svg" className="w-16 h-16 mb-4" alt="Opeari" />
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
