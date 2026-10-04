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

// Galaxy Furniture palette (recharts needs raw hex, not Tailwind classes)
const COLORS = {
    line: "#E2D8C6",
    stone: "#6F665A",
    ink: "#2A251F",
    card: "#FFFDF9",
    moss: "#4A4A2C",
    clay: "#A67C52"
};

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
        <div className="rounded-3xl border border-line bg-card p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-ink">Revenue by month</h2>
            <p className="text-xs text-stone mt-0.5 mb-4">
                {year ? `Monthly trend for ${year}` : "All-time monthly trend"}
            </p>

            {loading ? (
                <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-stone">
                    Loading chart…
                </div>
            ) : error ? (
                <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-red-700">{error}</div>
            ) : rows.length === 0 ? (
                <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-stone">
                    No sales in this period yet.
                </div>
            ) : (
                <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rows} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: COLORS.stone }}
                                axisLine={{ stroke: COLORS.line }}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: COLORS.stone }}
                                axisLine={false}
                                tickLine={false}
                                width={44}
                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(166,124,82,0.08)" }}
                                formatter={(value, name) => [money(value), name === "revenue" ? "Revenue" : "Profit"]}
                                contentStyle={{
                                    fontSize: 12,
                                    borderRadius: 16,
                                    border: `1px solid ${COLORS.line}`,
                                    background: COLORS.card,
                                    color: COLORS.ink,
                                    boxShadow: "0 12px 32px -12px rgba(42,37,31,0.25)"
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.stone }} />
                            <Bar dataKey="revenue" name="Revenue" fill={COLORS.moss} radius={[6, 6, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill={COLORS.clay} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}