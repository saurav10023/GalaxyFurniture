// src/components/admin/layout/AdminSidebar.jsx
import { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/products", label: "Products" },
    { to: "/admin/sell-out", label: "Sell Out" },
    { to: "/admin/analytics", label: "Analytics" },
    { to: "/admin/payments", label: "Payments" }
];

const linkClasses = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

export default function AdminSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-3 left-3 z-30 rounded-md border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                aria-label="Open navigation"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
            </button>

            {/* Mobile overlay */}
            {open && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setOpen(false)} />
            )}

            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col
                    transform transition-transform md:transform-none
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Admin</span>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="md:hidden text-slate-400 hover:text-slate-600 text-xl leading-none"
                        aria-label="Close navigation"
                    >
                        ×
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={linkClasses}
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}