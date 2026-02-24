import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';
import { useState, useEffect } from 'react';

export default function RequireAuth() {
    const { user, loading } = useAuth();
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTimedOut(true), 10000);
        return () => clearTimeout(timer);
    }, []);

    if (loading && !timedOut) {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
