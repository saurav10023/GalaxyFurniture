// src/pages/admin/AdminHome.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AnalyticsSummaryCards from "../../components/admin/analytics/AnalyticsSummaryCards";
import {
    IconProducts,
    IconSellOut,
    IconAnalytics,
    IconPaymentsDue,
    IconPaymentHistory,
    IconSalesHistory,
    IconChevronRight
} from "../../components/admin/icons/AdminIcons";

const SECTIONS = [
    {
        to: "/admin/products",
        title: "Products",
        description: "Create products, categories, and browse your catalog.",
        Icon: IconProducts,
        tint: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
    },
    {
        to: "/admin/sell-out",
        title: "Sell Out",
        description: "Record a checkout and view recent sales.",
        Icon: IconSellOut,
        tint: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
    },
    {
        to: "/admin/analytics",
        title: "Analytics",
        description: "Revenue, profit, and top-performing categories.",
        Icon: IconAnalytics,
        tint: "bg-violet-50 text-violet-600 group-hover:bg-violet-100"
    },
    {
        to: "/admin/payments",
        title: "Payments Due",
        description: "Customers who still owe money on a sale.",
        Icon: IconPaymentsDue,
        tint: "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
    },
    {
        to: "/admin/payments/history",
        title: "Payment History",
        description: "Search and edit every payment ever recorded.",
        Icon: IconPaymentHistory,
        tint: "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
    },
    {
        to: "/admin/sales/history",
        title: "Sales History",
        description: "Search and edit every sale ever recorded.",
        Icon: IconSalesHistory,
        tint: "bg-sky-50 text-sky-600 group-hover:bg-sky-100"
    }
];

const today = () =>
    new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

export default function AdminHome() {
    const { user } = useAuth();

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-indigo-600">{today()}</span>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                    Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-sm text-slate-500">Here's a snapshot of your store, all-time.</p>
            </div>

            <AnalyticsSummaryCards />

            <div>
                <div className="flex items-baseline justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-700">Jump into a section</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SECTIONS.map(({ to, title, description, Icon, tint }) => (
                        <Link
                            key={to}
                            to={to}
                            className="group relative rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex items-start gap-4
                                hover:border-indigo-200 hover:shadow-sm transition-all"
                        >
                            <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-colors ${tint}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
                            </div>
                            <IconChevronRight
                                className="h-4 w-4 text-slate-300 shrink-0 mt-1 transition-transform
                                    group-hover:translate-x-0.5 group-hover:text-indigo-400"
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}