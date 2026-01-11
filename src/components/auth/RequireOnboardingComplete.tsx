import { Navigate, Outlet } from 'react-router-dom';
import { useViewer } from '../../hooks/useViewer';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

export default function RequireOnboardingComplete() {
    const { viewer, loading, error, refresh } = useViewer();
    const { signOut } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (error || !viewer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffaf5] p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e8e4de] max-w-md w-full text-center">
                    <h2 className="text-xl font-bold text-[#1E6B4E] mb-2">Unable to Load Profile</h2>
                    <p className="text-[#5a6e5a] mb-6 text-sm">
                        {error?.message || "We couldn't retrieve your account information."}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => refresh()}
                            className="w-full px-6 py-3 bg-[#1E6B4E] text-white rounded-xl font-semibold hover:bg-[#165a40] transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => signOut()}
                            className="w-full px-6 py-3 border border-[#e8e4de] text-[#5a6e5a] rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Check Auth Metadata first (Source of Truth from useOnboarding), then Member table fallback
    const raw = viewer.user?.user_metadata?.onboarding_complete ?? viewer.member?.onboarding_complete;
    const isComplete = raw === true || raw === 'true';

    if (!isComplete) {
        return <Navigate to="/onboarding?step=0" replace />;
    }

    return <Outlet />;
}
