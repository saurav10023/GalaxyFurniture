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
                    className="md:hidden fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col
                    transform transition-transform duration-200 ease-out md:transform-none
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                <div className="h-14 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                            A
                        </div>
                        <span className="text-sm font-semibold text-slate-900">Admin Panel</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded"
                        aria-label="Close navigation"
                    >
                        <IconClose className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ to, label, end, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors
                                ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full transition-colors
                                        ${isActive ? "bg-indigo-600" : "bg-transparent"}`}
                                    />
                                    <Icon
                                        className={`h-[18px] w-[18px] shrink-0 ${
                                            isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"
                                        }`}
                                    />
                                    <span className="truncate">{label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-5 py-3 border-t border-slate-100 shrink-0">
                    <p className="text-[11px] text-slate-400">Admin Panel · v1.0</p>
                </div>
            </aside>
        </>
    );
}