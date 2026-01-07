import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function DevDebugPanel() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<{ status: number; message: string } | null>(null);

    // Only show in DEV mode
    if (!import.meta.env.DEV) return null;

    const fetchData = async () => {
        if (!user) {
            setData(null);
            return;
        }

        setLoading(true);
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            setApiError({ status: 500, message: error.message });
        } else {
            setApiError(null);
        }

        setData(member);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, user]);

    const handleResetOnboarding = async () => {
        if (!user) return;
        if (!confirm('Are you sure you want to RESET onboarding for this user? This will clear progress and set onboarding_complete = false.')) return;

        // 1. Reset Member Onboarding Status
        const { error } = await supabase
            .from('members')
            .update({ onboarding_complete: false })
            .eq('id', user.id);

        if (error) {
            alert('Error validating reset: ' + error.message);
            return;
        }

        // 2. Clear LocalStorage for this user
        const storageKey = `opeari_onboarding_progress_${user.id}`;
        localStorage.removeItem(storageKey);

        alert('Onboarding reset! Refreshing page...');
        window.location.reload();
    };

    if (!user) return null; // Don't show if not logged in (or maybe show "Guest" state?)

    return (
        <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-red-600 text-white px-3 py-1 rounded shadow-lg opacity-50 hover:opacity-100 transition-opacity translate-y-20 hover:translate-y-0"
                >
                    DEV DEBUG
                </button>
            ) : (
                <div className="bg-gray-900 text-green-400 p-4 rounded shadow-2xl border border-green-800 w-80 max-h-[80vh] overflow-auto">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                        <h3 className="font-bold text-white">Opeari Dev Tools</h3>
                        <div className="flex gap-2">
                            <button onClick={fetchData} className="text-blue-400 hover:text-blue-300">↻</button>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <span className="text-gray-500">User ID:</span>
                            <span className="ml-1 text-white select-all">{user.id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-1 text-white select-all">{user.email}</span>
                        </div>

                        <div className="border-t border-gray-800 pt-2 mt-2">
                            <span className="text-gray-500">Member Row:</span>
                            {loading ? (
                                <span className="ml-1 text-yellow-500"> Checking...</span>
                            ) : data ? (
                                <span className="ml-1 text-green-500">EXISTS</span>
                            ) : (
                                <span className="ml-1 text-red-500 font-bold">MISSING</span>
                            )}
                        </div>

                        {data && (
                            <>
                                <div>
                                    <span className="text-gray-500">Onboarding:</span>
                                    <span className={data.onboarding_complete ? "ml-1 text-green-500" : "ml-1 text-red-500"}>
                                        {data.onboarding_complete ? 'COMPLETE' : 'INCOMPLETE'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Role:</span>
                                    <span className="ml-1 text-purple-400">{data.role}</span>
                                </div>
                            </>
                        )}

                        {apiError && (
                            <div className="mt-2 text-red-400 border border-red-900 bg-red-900/20 p-2 rounded">
                                <div>STATUS: {apiError.status}</div>
                                <div>ERR: {apiError.message}</div>
                            </div>
                        )}

                        <button
                            onClick={handleResetOnboarding}
                            className="w-full mt-4 bg-red-900/50 hover:bg-red-800 text-red-200 py-1 px-2 rounded border border-red-800 transition-colors"
                        >
                            ⚠ RESET ONBOARDING
                        </button>

                        {/* QA SHORTCUTS */}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="font-bold text-gray-400 mb-2">QA Helpers</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <QAAuthButton
                                    label="Parent (Farrell)"
                                    email="breadafarrell@gmail.com"
                                    role="family"
                                />
                                <QAAuthButton
                                    label="Caregiver (Opeari)"
                                    email="breadaopeari@gmail.com"
                                    role="caregiver"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function QAAuthButton({ label, email, role }: { label: string, email: string, role: string }) {
    const [status, setStatus] = useState('Idle');

    const handleClick = async () => {
        setStatus('Logging in...');
        const password = "Testing1!";

        // 1. Try Login
        let { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                setStatus('Creating...');
                // 2. Try Create
                const { error: upError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: role === 'family' ? 'Breada' : 'Nurse',
                            last_name: role === 'family' ? 'Farrell' : 'Joy',
                            intent: role
                        }
                    }
                });

                if (upError) {
                    console.error(upError);
                    setStatus('Fail: ' + upError.message);
                } else {
                    setStatus('Created! Retrying login...');
                    // 3. Retry Login immediately
                    const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
                    if (retryError) {
                        setStatus('Login Fail 2');
                    } else {
                        setStatus('Success! Reloading...');
                        window.location.reload();
                    }
                }
            } else {
                console.error(error);
                setStatus('Err: ' + error.message);
            }
        } else {
            setStatus('Success! Redirecting...');
            await new Promise(r => setTimeout(r, 1000));
            window.location.href = '/onboarding';
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={status !== 'Idle' && !status.startsWith('Fail')}
            className={`py-1 px-2 rounded border text-center text-xs transition-colors
                ${status.includes('Success') ? 'bg-green-900 text-green-200 border-green-800' :
                    status.includes('Fail') || status.includes('Err') ? 'bg-red-900 text-red-200 border-red-800' :
                        'bg-blue-900/50 text-blue-200 border-blue-800 hover:bg-blue-800'}
            `}
        >
            {status === 'Idle' ? label : status}
        </button>
    );
}
