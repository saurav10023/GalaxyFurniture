// src/components/admin/analytics/TopCategoriesTable.jsx
import { useEffect, useState } from "react";
import { getBestSellingCategories } from "../../../api/admin/analytics.api";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// dateFrom / dateTo: optional range filters, limit: how many rows to show
export default function TopCategoriesTable({ dateFrom, dateTo, limit = 10 }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getBestSellingCategories({ dateFrom, dateTo, limit });
                if (!cancelled) setRows(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.response?.data?.message || "Couldn't load top categories.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [dateFrom, dateTo, limit]);

    const maxRevenue = rows.reduce((max, row) => Math.max(max, row.revenue), 0);

    return (
        <div className="rounded-3xl border border-line bg-card overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-line">
                <h2 className="font-display text-xl font-semibold text-ink">Top categories</h2>
                <p className="text-xs text-stone mt-0.5">Ranked by revenue.</p>
            </div>

            {loading ? (
                <div className="px-5 py-8 text-sm text-stone text-center">Loading…</div>
            ) : error ? (
                <div className="px-5 py-8 text-sm text-red-700 text-center">{error}</div>
            ) : rows.length === 0 ? (
                <div className="px-5 py-8 text-sm text-stone text-center">
                    No category sales in this period yet.
                </div>
            ) : (
                <div className="divide-y divide-line">
                    {rows.map((row) => (
                        <div key={row.categoryId} className="px-4 sm:px-6 py-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium text-ink truncate">{row.categoryName}</span>
                                <span className="text-stone shrink-0">{money(row.revenue)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className="h-1.5 flex-1 rounded-full bg-linen overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-moss"
                                        style={{
                                            width: maxRevenue ? `${(row.revenue / maxRevenue) * 100}%` : "0%"
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-stone whitespace-nowrap">
                                    {row.unitsSold} units
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}