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
        <header
            className="h-14 sm:h-16 bg-white/90 backdrop-blur-sm flex items-center justify-between gap-3
                px-3 sm:px-6 sticky top-0 z-20 shadow-sm shadow-slate-200/60 border-b border-slate-100"
        >
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="md:hidden shrink-0 rounded-lg p-2 -ml-1 text-slate-500 active:bg-slate-100
                        hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    aria-label="Open navigation"
                >
                    <IconMenu className="h-5 w-5" />
                </button>
                <h1 className="text-[15px] sm:text-base font-semibold text-slate-900 truncate">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-sm font-medium text-slate-800">{user?.name || "Admin"}</span>
                    <span className="text-xs text-slate-400">{user?.mobileNumber}</span>
                </div>

                <div
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-indigo-600 text-white text-sm font-semibold
                        flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm"
                >
                    {(user?.name || "A").charAt(0).toUpperCase()}
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600
                        border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg
                        p-2 sm:px-3 sm:py-1.5 transition-colors"
                >
                    <IconLogout className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Log out</span>
                </button>
            </div>
        </header>
    );
}