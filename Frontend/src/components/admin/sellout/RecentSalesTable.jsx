// src/components/admin/sellout/RecentSalesTable.jsx
import { useEffect, useState } from "react";
import { getAllSales } from "../../../api/admin/sellout.api";
import { IconInbox } from "../icons/AdminIcons";

const STATUS_STYLES = {
    paid: "bg-emerald-50 text-emerald-700",
    partially_paid: "bg-amber-50 text-amber-700",
    pending: "bg-rose-50 text-rose-700"
};

const STATUS_DOTS = {
    paid: "bg-emerald-500",
    partially_paid: "bg-amber-500",
    pending: "bg-rose-500"
};

const STATUS_LABELS = {
    paid: "Paid",
    partially_paid: "Partially paid",
    pending: "Pending"
};

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function summarizeItems(items = []) {
    if (items.length === 0) return "—";
    const first = `${items[0].productName} ×${items[0].quantity}`;
    if (items.length === 1) return first;
    return `${first} +${items.length - 1} more`;
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_STYLES[status] || STATUS_STYLES.pending
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] || STATUS_DOTS.pending}`} />
            {STATUS_LABELS[status] || status}
        </span>
    );
}

export default function RecentSalesTable({ refreshKey }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadSales() {
            setLoading(true);
            setError(null);
            try {
                const data = await getAllSales({ page: 1, limit: 10 });
                if (!cancelled) {
                    setSales(data.sales || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message || "Could not load recent sales."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadSales();
        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Recent sales</h2>
                <p className="text-xs text-slate-500 mt-0.5">Last 10 checkouts, most recent first.</p>
            </div>

            {loading ? (
                <div className="px-5 py-14 text-sm text-slate-500 text-center">Loading recent sales…</div>
            ) : error ? (
                <div className="px-5 py-14 text-sm text-rose-600 text-center">{error}</div>
            ) : sales.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-slate-400 py-14">
                    <IconInbox className="h-8 w-8" />
                    <span className="text-sm">No sales recorded yet. New checkouts will show up here.</span>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50">
                                    <th className="px-5 py-2.5">Invoice</th>
                                    <th className="px-5 py-2.5">Customer</th>
                                    <th className="px-5 py-2.5">Items</th>
                                    <th className="px-5 py-2.5 text-right">Billed</th>
                                    <th className="px-5 py-2.5 text-right">Paid</th>
                                    <th className="px-5 py-2.5 text-right">Due</th>
                                    <th className="px-5 py-2.5">Status</th>
                                    <th className="px-5 py-2.5">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sales.map((sale) => (
                                    <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                                            {sale.invoiceNumber}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-slate-900">{sale.customer?.name}</div>
                                            <div className="text-xs text-slate-500">{sale.customer?.phone}</div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 max-w-[220px] truncate">
                                            {summarizeItems(sale.items)}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-900 whitespace-nowrap">
                                            {formatCurrency(sale.billedAmount)}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-600 whitespace-nowrap">
                                            {formatCurrency(sale.amountPaid)}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-600 whitespace-nowrap">
                                            {formatCurrency(sale.pendingAmount)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <StatusBadge status={sale.status} />
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                                            {formatDate(sale.saleDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {sales.map((sale) => (
                            <div key={sale._id} className="px-4 py-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-900 truncate">
                                            {sale.customer?.name}
                                        </div>
                                        <div className="text-xs text-slate-400">{sale.customer?.phone}</div>
                                    </div>
                                    <StatusBadge status={sale.status} />
                                </div>

                                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                                    <span className="font-mono">{sale.invoiceNumber}</span>
                                    <span>{formatDate(sale.saleDate)}</span>
                                </div>

                                <div className="text-xs text-slate-500 mt-1 truncate">{summarizeItems(sale.items)}</div>

                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                                    <div>
                                        <div className="text-[11px] text-slate-400">Billed</div>
                                        <div className="text-sm font-medium text-slate-800">
                                            {formatCurrency(sale.billedAmount)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400">Paid</div>
                                        <div className="text-sm font-medium text-emerald-700">
                                            {formatCurrency(sale.amountPaid)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400">Due</div>
                                        <div className="text-sm font-medium text-rose-600">
                                            {formatCurrency(sale.pendingAmount)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}