// src/components/admin/layout/AdminSidebar.jsx
// Floating "liquid glass" sidebar: frosted translucent panel, soft colour
// blobs behind the glass, glossy edge highlights, and a solid olive active pill.
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

const NAV_GROUPS = [
    {
        heading: "Store",
        items: [
            { to: "/admin", label: "Overview", end: true, Icon: IconOverview },
            { to: "/admin/products", label: "Products", Icon: IconProducts },
            { to: "/admin/sell-out", label: "Sell Out", Icon: IconSellOut }
        ]
    },
    {
        heading: "Insights",
        items: [
            { to: "/admin/analytics", label: "Analytics", Icon: IconAnalytics },
            { to: "/admin/sales/history", label: "Sales History", Icon: IconSalesHistory }
        ]
    },
    {
        heading: "Payments",
        items: [
            { to: "/admin/payments", label: "Payment Dues", end: true, Icon: IconPaymentsDue },
            { to: "/admin/payments/history", label: "Payment History", Icon: IconPaymentHistory }
        ]
    }
];

export default function AdminSidebar({ open = false, onClose = () => {} }) {
    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="md:hidden fixed inset-0 z-[60] bg-ink/35 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-2 left-2 md:sticky md:inset-y-auto md:left-auto md:top-3 md:m-3 md:h-[calc(100dvh-1.5rem)] md:self-start
                    z-[70] md:z-40 w-[17rem] max-w-[calc(100vw-1rem)] shrink-0 flex flex-col min-h-0 overflow-hidden isolate
                    rounded-[28px] border border-white/60
                    bg-gradient-to-b from-white/60 via-white/40 to-white/25
                    backdrop-blur-2xl backdrop-saturate-[1.8]
                    shadow-[0_24px_60px_-24px_rgba(42,37,31,0.45),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.35)]
                    transform transition-transform duration-300 ease-out md:transform-none
                    ${open ? "translate-x-0" : "-translate-x-[115%] md:translate-x-0"}`}
            >
                {/* Liquid blobs behind the glass content */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-16 -left-12 h-48 w-48 rounded-full bg-clay/30 blur-3xl" />
                    <div className="absolute top-1/3 -right-16 h-56 w-56 rounded-full bg-moss/20 blur-3xl" />
                    <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-clay/20 blur-3xl" />
                </div>
                {/* Glossy top sheen */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-24 -z-10 bg-gradient-to-b from-white/50 to-transparent"
                />

                {/* Header */}
                <div className="h-16 px-4 flex items-center justify-between gap-2 border-b border-white/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-moss to-moss/80 text-card font-display text-lg font-semibold flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(57,58,34,0.8),inset_0_1px_0_rgba(255,255,255,0.35)]">
                            G
                        </div>
                        <div className="leading-tight min-w-0">
                            <span className="block font-display text-[17px] font-semibold text-ink truncate">
                                Galaxy <span className="text-clay">Furniture</span>
                            </span>
                            <span className="block text-[10.5px] font-medium uppercase tracking-[0.16em] text-stone">
                                Admin panel
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden shrink-0 text-ink/70 hover:text-ink bg-white/50 hover:bg-white/80 border border-white/70 p-1.5 rounded-full transition-colors"
                        aria-label="Close navigation"
                    >
                        <IconClose className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation (min-h-0 lets it scroll instead of overflowing the panel) */}
                <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5 [scrollbar-width:thin]">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.heading}>
                            <p className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-stone/80">
                                {group.heading}
                            </p>
                            <div className="space-y-1">
                                {group.items.map(({ to, label, end, Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        end={end}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 min-w-0
                                            ${
                                                isActive
                                                    ? "bg-gradient-to-br from-moss to-moss/85 text-card shadow-[0_10px_22px_-10px_rgba(57,58,34,0.85),inset_0_1px_0_rgba(255,255,255,0.25)]"
                                                    : "text-ink/75 hover:text-ink hover:bg-white/60 hover:shadow-[0_6px_16px_-10px_rgba(42,37,31,0.4),inset_0_1px_0_rgba(255,255,255,0.8)]"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                                                        isActive
                                                            ? "bg-white/15"
                                                            : "bg-white/55 group-hover:bg-white/80 border border-white/60"
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`h-[17px] w-[17px] ${
                                                            isActive ? "text-card" : "text-clay"
                                                        }`}
                                                    />
                                                </span>
                                                <span className="truncate flex-1 min-w-0">{label}</span>
                                                {isActive && (
                                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-card/80" />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="shrink-0 p-3 border-t border-white/50">
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/45 border border-white/60 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <NavLink
                            to="/"
                            onClick={onClose}
                            className="text-[12.5px] font-medium text-ink/80 hover:text-ink transition-colors truncate"
                        >
                            View storefront
                        </NavLink>
                        <span className="text-[11px] text-stone shrink-0">v1.0</span>
                    </div>
                </div>
            </aside>
        </>
    );
}