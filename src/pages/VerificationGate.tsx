
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerificationGate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleContinue = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Update database: status='pending', fee_acknowledged=true
            const { error } = await supabase
                .from('members')
                .update({
                    vetting_status: 'pending',
                    vetting_fee_acknowledged: true
                })
                .eq('id', user.id);

            if (error) throw error;
            setShowSuccess(true);
        } catch (err) {
            console.error('Error starting verification:', err);
            // Fallback: navigate to dashboard? Or show error?
            // For now, let's just log it.
        } finally {
            setLoading(false);
        }
    };

    const handleMaybeLater = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Update database: status='required' (explicitly set/confirm it)
            const { error } = await supabase
                .from('members')
                .update({ vetting_status: 'required' })
                .eq('id', user.id);

            if (error) console.error('Error updating status:', error);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            navigate('/dashboard');
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-opeari-bg flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-card p-8 max-w-md w-full text-center animate-fade-in relative overflow-hidden">
                    <div className="text-[#1e6b4e] mb-6 flex justify-center">
                        <ShieldCheck size={64} />
                    </div>
                    <h1 className="text-3xl font-bold text-opeari-heading mb-4">
                        You're on the list!
                    </h1>
                    <div className="space-y-4 text-gray-600 mb-8">
                        <p>Verification is coming soon. We'll email you when it's ready.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-[#1e6b4e] text-white py-4 rounded-xl font-bold hover:bg-[#154d38] transition-all shadow-button"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-opeari-bg flex items-center justify-center p-0 md:p-6" style={{ fontFamily: "'Comfortaa', sans-serif" }}>
            <div className="w-full max-w-6xl md:h-[min(800px,90vh)] bg-white md:rounded-3xl md:shadow-[0_25px_50px_-12px_rgba(30,107,78,0.25)] overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-0">

                {/* LEFT PANEL */}
                <div className="hidden md:flex md:w-[40%] bg-opeari-bg flex-col items-center justify-center p-12 text-center relative transition-all duration-500 border-none">
                    <div className="mb-6 w-56 h-56">
                        <img
                            src="/opeari-shield.png" // Using existing asset if avail, or verify later. For now assume match or shield.
                            onError={(e) => { e.currentTarget.src = '/opeari-match.png' }} // Fallback
                            alt="Verification"
                            className="w-full h-full object-contain animate-fade-in"
                        />
                    </div>
                    <h2 className="text-xl font-bold text-[#1e6b4e] mb-2">A safer way to share care</h2>
                    <p className="text-lg text-[#1e6b4e]/80 font-medium leading-relaxed animate-fade-in whitespace-pre-line">
                        When kids are in someone else's home, trust shouldn't be a guessing game.
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative overflow-y-auto">
                    <div className="flex-1 p-6 md:p-12 flex flex-col justify-center">
                        <div className="max-w-xl mx-auto space-y-8">

                            <div>
                                <h1 className="text-3xl font-bold text-opeari-heading mb-3">Verify to Host</h1>
                                <p className="text-gray-500 text-lg">Since other families will trust you with their children, we ask all hosts to complete a one-time verification.</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    "Unlock hosting and care swaps",
                                    "Earn the 'Verified Host' badge",
                                    "Build trust with local families"
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#e8f5f0] flex items-center justify-center text-[#1e6b4e]">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span className="font-medium text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Trust Visual */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="space-y-1 mb-2">
                                    <div className="p-2 text-center text-gray-400 text-sm">Your inner circle - <span className="font-medium">Friends & family</span></div>
                                    <div className="p-3 bg-[#8bd7c7]/20 text-[#1e6b4e] font-bold text-center rounded-lg border border-[#8bd7c7]">
                                        Verified Opeari hosts - Background checked
                                    </div>
                                    <div className="p-2 text-center text-gray-400 text-sm">Strangers - <span className="font-medium">Unknown</span></div>
                                </div>
                                <p className="text-xs text-center text-gray-400 uppercase tracking-wider font-bold">We're building the trusted layer in between</p>
                            </div>

                            {/* Fee Card */}
                            <div className="p-5 bg-[#fffaf5] rounded-xl border border-[#F8C3B3] flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-opeari-heading">One-time verification: $35</span>
                                    <span className="text-xs font-bold text-[#F8C3B3] uppercase tracking-wide">Pays for itself in 1 session</span>
                                </div>
                                <p className="text-xs text-gray-500">Background check integration coming soon — built to the same standard used by leading platforms.</p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={handleContinue}
                                    disabled={loading}
                                    className="w-full bg-[#F8C3B3] text-[#1e6b4e] py-4 rounded-xl font-bold hover:bg-[#f5b2a1] transition-all hover:-translate-y-0.5 shadow-button hover:shadow-button-hover disabled:opacity-70"
                                >
                                    {loading ? 'Processing...' : 'Continue to Verification →'}
                                </button>
                                <button
                                    onClick={handleMaybeLater}
                                    disabled={loading}
                                    className="w-full bg-white text-gray-400 py-3 rounded-xl font-medium hover:text-gray-600 transition-colors"
                                >
                                    Maybe Later
                                </button>
                                <p className="text-xs text-gray-300 text-center">
                                    We don't sell your data. Verification is for community trust.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
