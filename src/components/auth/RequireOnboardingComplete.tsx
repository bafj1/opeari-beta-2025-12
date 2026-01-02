import { Navigate, Outlet } from 'react-router-dom';
import { useViewer } from '../../hooks/useViewer';
import Loading from '../common/Loading';

export default function RequireOnboardingComplete() {
    const { viewer, loading } = useViewer();

    if (loading) {
        return <Loading />;
    }

    if (!viewer) {
        // Safe fallback - if viewer load fails, likely auth issue or network. 
        // RequireAuth wrapping this should handle strict auth checks.
        // If simply failed to load row, we might want to retry or show error, 
        // but for a guard, preventing access is safer.
        return <Navigate to="/onboarding?step=0" replace />;
    }

    // Check Auth Metadata first (Source of Truth from useOnboarding), then Member table fallback
    const isComplete = viewer.user?.user_metadata?.onboarding_complete || viewer.member?.onboarding_complete;

    if (!isComplete) {
        return <Navigate to="/onboarding?step=0" replace />;
    }

    return <Outlet />;
}
