// src/components/admin/layout/AdminSidebar.jsx
import { NavLink } from "react-router-dom";
import {
    IconOverview,
    IconProducts,
    IconSellOut,
    IconAnalytics,
    IconSalesHistory,
    IconPaymentsDue,
    IconPaymentHistory,
    IconClose
} from "../icons/AdminIcons";

const NAV_ITEMS = [
    { to: "/admin", label: "Overview", end: true, Icon: IconOverview },
    { to: "/admin/products", label: "Products", Icon: IconProducts },
    { to: "/admin/sell-out", label: "Sell Out", Icon: IconSellOut },
    { to: "/admin/analytics", label: "Analytics", Icon: IconAnalytics },
    { to: "/admin/sales/history", label: "Sales History", Icon: IconSalesHistory },
    { to: "/admin/payments", label: "Payment Dues", Icon: IconPaymentsDue },
    { to: "/admin/payments/history", label: "Payment History", Icon: IconPaymentHistory }
];

export default function AdminSidebar({ open = false, onClose = () => {} }) {
    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 md:sticky md:inset-y-auto md:top-0 md:h-[100dvh] md:self-start z-40 w-64 shrink-0 bg-sand border-r border-line flex flex-col
                    transform transition-transform duration-200 ease-out md:transform-none
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                <div className="h-14 sm:h-16 px-5 flex items-center justify-between border-b border-line shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-moss text-card font-display text-lg font-semibold flex items-center justify-center">
                            G
                        </div>
                        <div className="leading-tight">
                            <span className="block font-display text-lg font-semibold text-ink">
                                Galaxy <span className="text-clay">Furniture</span>
                            </span>
                            <span className="block text-[11px] text-stone">Admin panel</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden text-stone hover:text-ink hover:bg-linen p-1.5 -mr-1.5 rounded-full transition-colors"
                        aria-label="Close navigation"
                    >
                        <IconClose className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map(({ to, label, end, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors
                                ${isActive ? "bg-moss text-card" : "text-stone hover:bg-linen hover:text-ink"}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={`h-[18px] w-[18px] shrink-0 ${
                                            isActive ? "text-card" : "text-clay"
                                        }`}
                                    />
                                    <span className="truncate">{label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-5 py-3 border-t border-line shrink-0">
                    <p className="text-[11px] text-stone">Version 1.0</p>
                </div>
            </aside>
        </>
    );
}