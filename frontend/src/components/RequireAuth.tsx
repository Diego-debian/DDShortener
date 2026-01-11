import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

interface RequireAuthProps {
    children: ReactNode;
}

/**
 * Route protection component
 * Redirects to /app/login if user is not authenticated
 */
export default function RequireAuth({ children }: RequireAuthProps) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // If not authenticated, render nothing (will redirect)
    if (!isAuthenticated()) {
        return null;
    }

    return <>{children}</>;
}
