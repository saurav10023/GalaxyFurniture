// src/components/admin/layout/AdminRouteGuard.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

// Wraps the admin section. While the auth check is in flight, show a
// lightweight loading state instead of flashing the login redirect.
// Once resolved: no user -> bounce to /login, otherwise render children.
export default function AdminRouteGuard({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-sm text-slate-400">Checking session…</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}