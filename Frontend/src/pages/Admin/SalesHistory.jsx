import { useCallback, useEffect, useState } from "react";
import { getAllSales, deleteSale } from "../../api/admin/sellout.api";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_LABELS = {
    paid: "Paid",
    partial: "Partially paid",
    due: "Due"
};

const STATUS_STYLES = {
    paid: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    due: "bg-red-50 text-red-700"
};

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "paid", label: "Paid" },
    { value: "partial", label: "Partially paid" },
    { value: "due", label: "Due" }
];

export default function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [status, setStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAllSales({
                status: status || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                page,
                limit: 20
            });
            setSales(result.sales);
            setPagination(result.pagination);
        } catch {
            setError("Couldn't load sales.");
        } finally {
            setLoading(false);
        }
    }, [status, dateFrom, dateTo, page]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (sale) => {
        const confirmed = window.confirm(
            `Delete sale ${sale.invoiceNumber}? ` +
                `This only works if no payments have been recorded against it yet. ` +
                `This cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(sale._id);
        setError(null);
        try {
            await deleteSale(sale._id);
            load();
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                "Couldn't delete that sale — it may already have payments recorded against it.";
            setError(message);
        } finally {
            setDeletingId(null);
        }
    };

    const changeFilter = (setter) => (value) => {
        setPage(1);
        setter(value);
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Sales history</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Every sale ever recorded, across all customers.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <select
                    value={status}
                    onChange={(e) => changeFilter(setStatus)(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => changeFilter(setDateFrom)(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => changeFilter(setDateTo)(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                        <tr>
                            <th className="text-left px-4 py-2.5">Date</th>
                            <th className="text-left px-4 py-2.5">Customer</th>
                            <th className="text-left px-4 py-2.5">Invoice</th>
                            <th className="text-left px-4 py-2.5">Status</th>
                            <th className="text-right px-4 py-2.5">Total</th>
                            <th className="text-right px-4 py-2.5">Paid</th>
                            <th className="text-right px-4 py-2.5">Balance</th>
                            <th className="text-right px-4 py-2.5">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center text-slate-400 py-10">
                                    Loading…
                                </td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center text-slate-400 py-10">
                                    No sales match these filters.
                                </td>
                            </tr>
                        ) : (
                            sales.map((s) => (
                                <tr key={s._id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 text-slate-600">
                                        {new Date(s.saleDate || s.createdAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="text-slate-800">{s.customer?.name}</div>
                                        <div className="text-xs text-slate-400">{s.customer?.phone}</div>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-slate-600">
                                        {s.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span
                                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                STATUS_STYLES[s.status] || "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {STATUS_LABELS[s.status] || s.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-slate-800">
                                        {money(s.totalAmount)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-emerald-700">
                                        {money(s.amountPaid)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium text-red-600">
                                        {money(s.balance)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(s)}
                                                disabled={deletingId === s._id}
                                                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                            >
                                                {deletingId === s._id ? "Deleting…" : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>
                        Page {pagination.page} of {pagination.pages} · {pagination.total} total
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page >= pagination.pages}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}