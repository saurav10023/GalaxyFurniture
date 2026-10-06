// src/components/admin/layout/AdminTopbar.jsx
// Sits directly under the site Navbar and uses the exact same look:
// transparent at the top of the page, light frosted sand pill once you scroll.
// On mobile the sidebar toggle is a floating glass button (AdminMenuFab),
// so the top of the screen stays clear of a second menu control.
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { IconLogout } from "../icons/AdminIcons";
import AdminMenuFab from "./AdminMenuFab";

const SCROLL_THRESHOLD = 12;

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
    const [scrolled, setScrolled] = useState(false);

    const title = PAGE_TITLES[location.pathname] || "Admin";

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        // top offset = the Navbar's height (pt-3 + 60px, or 54px once scrolled),
        // so this bar docks right under it instead of overlapping it.
        <header
            className={` z-20 px-3 sm:px-5 pt-2 transition-[top] duration-300 ${
                scrolled ? "top-[66px]" : "top-[72px]"
            }`}
        >
            {/* Mobile: floating liquid-glass sidebar toggle (portaled to <body>) */}
            <AdminMenuFab onClick={onMenuClick} />

            <div
                className={`mx-auto rounded-full border transition-all duration-500 ${
                    scrolled
                        ? "bg-[#F1EADB]/75 backdrop-blur-xl backdrop-saturate-150 border-white/50 shadow-[0_12px_32px_-20px_rgba(42,37,31,0.35)]"
                        : "bg-transparent backdrop-blur-0 border-transparent shadow-none"
                }`}
            >
                <div
                    className={`flex items-center justify-between gap-3 px-3.5 sm:px-3 transition-[height] duration-300 ${
                        scrolled ? "h-[50px]" : "h-[56px]"
                    }`}
                >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <h1 className="font-serif text-[19px] sm:text-[23px] font-semibold text-ink tracking-[0.02em] leading-none truncate pl-[58px] md:pl-2">
                            {title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="hidden sm:flex flex-col items-end leading-tight">
                            <span className="text-[13.5px] font-medium text-ink">{user?.name || "Admin"}</span>
                            {user?.mobileNumber && (
                                <span className="text-[11.5px] text-stone">{user.mobileNumber}</span>
                            )}
                        </div>

                        <span className="w-9 h-9 rounded-full bg-moss text-paper text-[13px] font-semibold flex items-center justify-center uppercase shrink-0">
                            {(user?.name || "A").charAt(0)}
                        </span>

                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Log out"
                            className="flex items-center gap-1.5 rounded-full bg-ink text-paper text-[13.5px] font-medium
                                hover:bg-ink/85 transition-colors p-2.5 sm:px-4 sm:py-2"
                        >
                            <IconLogout className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">Log out</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}