// src/components/admin/analytics/AnalyticsSummaryCards.jsx
import { useEffect, useState } from "react";
import { getDashboardOverview } from "../../../api/admin/analytics.api";
import { IconSales, IconRevenue, IconProfit, IconPending, IconStock } from "../icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CARD_DEFS = [
    {
        key: "totalSales",
        label: "Total sales",
        format: (v) => v ?? 0,
        Icon: IconSales,
        tint: "bg-linen text-stone"
    },
    {
        key: "totalRevenue",
        label: "Revenue",
        format: money,
        Icon: IconRevenue,
        tint: "bg-moss/10 text-moss"
    },
    {
        key: "estimatedProfit",
        label: "Estimated profit",
        format: money,
        Icon: IconProfit,
        tint: "bg-clay/15 text-clay",
        accent: "text-moss"
    },
    {
        key: "pendingPayments",
        label: "Pending payments",
        format: money,
        Icon: IconPending,
        tint: "bg-clay/15 text-clay",
        accent: "text-clay"
    },
    {
        key: "stockValue",
        label: "Stock value",
        format: money,
        Icon: IconStock,
        tint: "bg-linen text-stone"
    }
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
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {CARD_DEFS.map(({ key, label, format, Icon, tint, accent }) => (
                <div
                    key={key}
                    className="rounded-3xl border border-line bg-card p-4 flex flex-col gap-3 hover:border-clay/50 transition-colors"
                >
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${tint}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-xs text-stone">{label}</div>
                        <div className={`font-display text-2xl font-semibold mt-0.5 ${accent || "text-ink"}`}>
                            {loading ? (
                                <span className="inline-block h-6 w-16 bg-linen rounded-full animate-pulse" />
                            ) : (
                                format(overview?.[key])
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}