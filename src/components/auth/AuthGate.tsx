import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useViewer } from '../../hooks/useViewer';

export default function AuthGate() {
    const { user, loading: authLoading } = useAuth();
    const { viewer, loading: viewerLoading } = useViewer();

    // 1. Wait for Auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
                <div className="text-[#1B4D3E] font-bold animate-pulse">Loading Auth...</div>
            </div>
        );
    }

    // 2. No User? -> Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Wait for Viewer (Row ensure + fetch)
    if (viewerLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
                <div className="text-[#1B4D3E] font-bold animate-pulse">Loading Profile...</div>
            </div>
        );
    }

    // 4. Viewer missing (Error state)? -> Error Screen (or Login)
    if (!viewer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F1EB] p-4">
                <div className="text-red-600 mb-4">Error loading profile. Please try again.</div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-[#1B4D3E] text-white rounded-full hover:opacity-90"
                >
                    Retry
                </button>
            </div>
        );
    }

    // 5. Onboarding Incomplete? -> Onboarding
    // Check canonical flag
    if (!viewer.member.onboarding_complete) {
        // Prevent redirect loop if already on onboarding is handled by App routing structure usually, 
        // but AuthGate typically wraps *protected* routes. Onboarding is often protected (requires auth).
        // If we are strictly wrapping "Dashboard", this is fine. 
        // If we wrap Onboarding with this, we create a loop if we assume AuthGate implies "Dashboard Access".
        // HOWEVER: The prompt Saled: "not authenticated -> login, onboarding_complete === false -> onboarding".
        // This suggests AuthGate *enforces* the state. 
        // If I wrap the whole app, I need to check `window.location`. 
        // But usually AuthGate wraps the *protected layout*.
        // So if I am on `/dashboard` and `!onboarding_complete`, I go to `/onboarding`.
        // If I am on `/onboarding`, I am likely in a different Route group OR I need to allow it.
        // I will assume AuthGate is for the "App" part (Dashboard, Settings, etc).
        // I will return <Navigate to="/onboarding" />. 
        // I must ensure `/onboarding` route is NOT wrapped by THIS SPECIFIC logic if it also requires Auth.
        // Often `/onboarding` has its OWN simpler Auth check or uses this same gate but conditionally?
        // Let's assume AuthGate protects the *main app*.
        return <Navigate to="/onboarding?step=0" replace />;
    }

    // 6. Authorized & Onboarded -> Render Child Routes
    return <Outlet />;
}
