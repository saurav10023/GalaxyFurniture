// src/components/admin/analytics/AnalyticsSummaryCards.jsx
import { useEffect, useState } from "react";
import { getDashboardOverview } from "../../../api/admin/analytics.api";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CARD_DEFS = [
    { key: "totalSales", label: "Total sales", format: (v) => v ?? 0, accent: "text-slate-900" },
    { key: "totalRevenue", label: "Revenue", format: money, accent: "text-slate-900" },
    { key: "estimatedProfit", label: "Estimated profit", format: money, accent: "text-emerald-700" },
    { key: "pendingPayments", label: "Pending payments", format: money, accent: "text-amber-700" },
    { key: "stockValue", label: "Stock value", format: money, accent: "text-slate-900" }
];

// dateFrom / dateTo: optional ISO date strings scoping sales-derived metrics.
// stockValue always reflects current inventory regardless of the range.
export default function AnalyticsSummaryCards({ dateFrom, dateTo }) {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getDashboardOverview({ dateFrom, dateTo });
                if (!cancelled) setOverview(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.response?.data?.message || "Couldn't load dashboard metrics.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [dateFrom, dateTo]);

    if (error) {
        return <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CARD_DEFS.map((card) => (
                <div key={card.key} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-xs text-slate-500">{card.label}</div>
                    <div className={`text-lg font-semibold mt-1 ${card.accent}`}>
                        {loading ? (
                            <span className="inline-block h-5 w-16 bg-slate-100 rounded animate-pulse" />
                        ) : (
                            card.format(overview?.[card.key])
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}