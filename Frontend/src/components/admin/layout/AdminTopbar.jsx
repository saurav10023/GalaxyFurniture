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
        // Frosted sand bar: navigation chrome is the one place glass is allowed.
        <header
            className="h-14 sm:h-16 bg-sand/80 backdrop-blur-md flex items-center justify-between gap-3
                px-3 sm:px-6 sticky top-0 z-20 border-b border-line
                shadow-[0_8px_24px_-16px_rgba(42,37,31,0.25)]"
        >
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="md:hidden shrink-0 rounded-full p-2.5 -ml-1 text-stone
                        hover:text-ink hover:bg-linen active:bg-linen transition-colors"
                    aria-label="Open navigation"
                >
                    <IconMenu className="h-5 w-5" />
                </button>
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink truncate">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-sm font-medium text-ink">{user?.name || "Admin"}</span>
                    <span className="text-xs text-stone">{user?.mobileNumber}</span>
                </div>

                <div
                    className="h-9 w-9 rounded-full bg-moss text-card font-display text-lg font-semibold
                        flex items-center justify-center shrink-0 ring-2 ring-card"
                >
                    {(user?.name || "A").charAt(0).toUpperCase()}
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="flex items-center gap-1.5 text-sm font-medium text-stone hover:text-red-700
                        border border-line hover:border-red-200 hover:bg-red-50 rounded-full
                        p-2.5 sm:px-4 sm:py-2 transition-colors"
                >
                    <IconLogout className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Log out</span>
                </button>
            </div>
        </header>
    );
}