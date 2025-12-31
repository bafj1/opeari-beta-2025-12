import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
                <div className="text-[#1B4D3E] font-bold animate-pulse">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/signin" replace />
    }

    return <>{children}</>
}
