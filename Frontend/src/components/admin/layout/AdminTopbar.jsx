// src/components/admin/layout/AdminTopbar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { IconMenu, IconLogout } from "../icons/AdminIcons";

const PAGE_TITLES = {
    "/admin": "Overview",
    "/admin/products": "Product Management",
    "/admin/sell-out": "Sell Out",
    "/admin/analytics": "Analytics",
    "/admin/payments": "Payments Due",
    "/admin/payments/history": "Payment History",
    "/admin/sales/history": "Sales History"
};

export default function AdminTopbar({ onMenuClick = () => {} }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const title = PAGE_TITLES[location.pathname] || "Admin";

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-2 min-w-0">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="md:hidden -ml-1 shrink-0 rounded-md p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    aria-label="Open navigation"
                >
                    <IconMenu className="h-5 w-5" />
                </button>
                <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-slate-800 leading-tight">{user?.name || "Admin"}</div>
                    <div className="text-xs text-slate-400 leading-tight">{user?.mobileNumber}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center shrink-0">
                    {(user?.name || "A").charAt(0).toUpperCase()}
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md px-2.5 sm:px-3 py-1.5 hover:bg-slate-50"
                >
                    <IconLogout className="h-4 w-4" />
                    <span className="hidden sm:inline">Log out</span>
                </button>
            </div>
        </header>
    );
}