import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const next = searchParams.get('next') || '/village';
        const type = searchParams.get('type');
        const destination = type === 'recovery' ? '/update-password' : next;

        let timeout: ReturnType<typeof setTimeout>;
        let interval: ReturnType<typeof setInterval>;
        let subscription: any;

        const handleAuth = async () => {
            // Check for session immediately
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    window.location.replace(destination);
                    return;
                }
            } catch (e) {
                console.error('Initial getSession failed:', e);
            }

            // Listen for auth state change
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                    data.subscription.unsubscribe();
                    clearInterval(interval);
                    clearTimeout(timeout);
                    window.location.replace(destination);
                } else if (event === 'PASSWORD_RECOVERY') {
                    data.subscription.unsubscribe();
                    clearInterval(interval);
                    clearTimeout(timeout);
                    window.location.replace('/update-password');
                }
            });
            subscription = data.subscription;

            // Poll for session every 500ms as backup
            interval = setInterval(async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        subscription?.unsubscribe();
                        window.location.replace(destination);
                    }
                } catch (e) {
                    // ignore
                }
            }, 500);

            // Final timeout — show error after 8 seconds
            timeout = setTimeout(() => {
                clearInterval(interval);
                subscription?.unsubscribe();
                setError('This link may have expired. Please request a new one.');
            }, 8000);
        };

        handleAuth();

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
            subscription?.unsubscribe();
        };
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffaf5] font-[Comfortaa]">
                <div className="text-center p-8 bg-white rounded-3xl shadow-lg border border-[#1e6b4e]/10 max-w-sm mx-4">
                    <h2 className="text-xl font-bold mb-2 text-[#1e6b4e]">Link Expired</h2>
                    <p className="text-[#546E5C] mb-6 text-sm">{error}</p>
                    <a
                        href="/login"
                        className="block px-6 py-2.5 bg-[#1e6b4e] text-white rounded-full font-semibold text-sm hover:bg-[#155a3e] transition-colors w-full text-center"
                    >
                        Back to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fffaf5]">
            <div className="animate-pulse flex flex-col items-center">
                <img src="/icon.svg" className="w-16 h-16 mb-4" alt="Opeari" />
                <p className="text-[#1e6b4e] font-bold text-sm tracking-wide uppercase">Verifying your link</p>
            </div>
        </div>
    );
}
