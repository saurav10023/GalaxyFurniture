// src/pages/admin/AdminHome.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AnalyticsSummaryCards from "../../components/admin/analytics/AnalyticsSummaryCards";

const SECTIONS = [
    {
        to: "/admin/products",
        title: "Products",
        description: "Create products, categories, and browse your catalog."
    },
    {
        to: "/admin/sell-out",
        title: "Sell Out",
        description: "Record a checkout and view recent sales."
    },
    {
        to: "/admin/analytics",
        title: "Analytics",
        description: "Revenue, profit, and top-performing categories."
    },
    {
        to: "/admin/payments",
        title: "Payments Due",
        description: "Customers who still owe money on a sale."
    },
    {
        to: "/admin/payments/history",
        title: "Payment History",
        description: "Search and edit every payment ever recorded."
    },
    {
    to: "/admin/sales/history",
    title: "Sales History",
    description: "Search and edit every sale ever recorded."
    },
];

export default function AdminHome() {
    const { user } = useAuth();

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">
                    Welcome{user?.name ? `, ${user.name}` : ""}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Here's a snapshot of your store, all-time.</p>
            </div>

            <AnalyticsSummaryCards />

            <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Jump into a section</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SECTIONS.map((section) => (
                        <Link
                            key={section.to}
                            to={section.to}
                            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                            <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}