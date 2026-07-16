// src/components/admin/analytics/RevenueChart.jsx
// Requires recharts: npm install recharts
import { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend
} from "recharts";
import { getMonthlySales } from "../../../api/admin/analytics.api";

const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// year: optional — omit for all-time monthly buckets
export default function RevenueChart({ year }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getMonthlySales(year ? { year } : {});
                if (!cancelled) {
                    setRows(
                        data.map((row) => ({
                            label: year
                                ? MONTH_LABELS[row.month - 1]
                                : `${MONTH_LABELS[row.month - 1]} '${String(row.year).slice(2)}`,
                            revenue: row.revenue,
                            profit: row.profit,
                            unitsSold: row.unitsSold
                        }))
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err?.response?.data?.message || "Couldn't load the revenue chart.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [year]);

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Revenue by month</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
                {year ? `Monthly trend for ${year}` : "All-time monthly trend"}
            </p>

            {loading ? (
                <div className="h-72 flex items-center justify-center text-sm text-slate-400">
                    Loading chart…
                </div>
            ) : error ? (
                <div className="h-72 flex items-center justify-center text-sm text-red-600">{error}</div>
            ) : rows.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-slate-400">
                    No sales in this period yet.
                </div>
            ) : (
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rows} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                axisLine={{ stroke: "#e2e8f0" }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                formatter={(value, name) => [money(value), name === "revenue" ? "Revenue" : "Profit"]}
                                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}