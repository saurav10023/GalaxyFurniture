// src/components/admin/sellout/RecentSalesTable.jsx
import { useEffect, useState } from "react";
import { getAllSales } from "../../../api/admin/sellout.api";

const STATUS_STYLES = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    partially_paid: "bg-amber-50 text-amber-700 ring-amber-600/20",
    pending: "bg-rose-50 text-rose-700 ring-rose-600/20"
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
        <div className="rounded-lg border border-slate-200 bg-white">
            <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Recent sales</h2>
                <p className="text-xs text-slate-500 mt-0.5">Last 10 checkouts, most recent first.</p>
            </div>

            {loading ? (
                <div className="px-5 py-8 text-sm text-slate-500 text-center">Loading recent sales…</div>
            ) : error ? (
                <div className="px-5 py-8 text-sm text-rose-600 text-center">{error}</div>
            ) : sales.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500 text-center">
                    No sales recorded yet. New checkouts will show up here.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
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
                                <tr key={sale._id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                                        {sale.invoiceNumber}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-slate-900">{sale.customer?.name}</div>
                                        <div className="text-xs text-slate-500">{sale.customer?.phone}</div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{summarizeItems(sale.items)}</td>
                                    <td className="px-5 py-3 text-right text-slate-900">
                                        {formatCurrency(sale.billedAmount)}
                                    </td>
                                    <td className="px-5 py-3 text-right text-slate-600">
                                        {formatCurrency(sale.amountPaid)}
                                    </td>
                                    <td className="px-5 py-3 text-right text-slate-600">
                                        {formatCurrency(sale.pendingAmount)}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                STATUS_STYLES[sale.status] || STATUS_STYLES.pending
                                            }`}
                                        >
                                            {STATUS_LABELS[sale.status] || sale.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                                        {formatDate(sale.saleDate)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}