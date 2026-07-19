// src/pages/admin/SalesHistory.jsx
import { useCallback, useEffect, useState } from "react";
import { getAllSales, deleteSale } from "../../api/admin/sellout.api";
import { IconInbox, IconTrash, IconChevronLeft, IconChevronRight, IconFilterX } from "../../components/admin/icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// These must match Sale.model.js's `status` enum exactly — the backend
// validates the `status` query param against ["paid", "partially_paid",
// "pending"] and 400s on anything else (that mismatch was why filtering by
// "partially paid" or "due" used to fail with "Couldn't load sales").
const STATUS_LABELS = {
    paid: "Paid",
    partially_paid: "Partially paid",
    pending: "Due"
};

const STATUS_STYLES = {
    paid: "bg-emerald-50 text-emerald-700",
    partially_paid: "bg-amber-50 text-amber-700",
    pending: "bg-red-50 text-red-700"
};

const STATUS_DOTS = {
    paid: "bg-emerald-500",
    partially_paid: "bg-amber-500",
    pending: "bg-red-500"
};

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "paid", label: "Paid" },
    { value: "partially_paid", label: "Partially paid" },
    { value: "pending", label: "Due" }
];

const fieldClasses =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_STYLES[status] || "bg-slate-100 text-slate-600"
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] || "bg-slate-400"}`} />
            {STATUS_LABELS[status] || status}
        </span>
    );
}

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

    const hasFilters = Boolean(status || dateFrom || dateTo);

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
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't load sales.");
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

    const clearFilters = () => {
        setPage(1);
        setStatus("");
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Sales history</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Every sale ever recorded, across all customers.
                </p>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <select
                    value={status}
                    onChange={(e) => changeFilter(setStatus)(e.target.value)}
                    className={`${fieldClasses} flex-1 min-w-[140px] sm:flex-none`}
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
                    max={dateTo || undefined}
                    onChange={(e) => changeFilter(setDateFrom)(e.target.value)}
                    className={`${fieldClasses} flex-1 min-w-[130px] sm:flex-none`}
                />
                <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => changeFilter(setDateTo)(e.target.value)}
                    className={`${fieldClasses} flex-1 min-w-[130px] sm:flex-none`}
                />
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 px-2 py-2"
                    >
                        <IconFilterX className="h-4 w-4" />
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                        <tr>
                            <th className="text-left px-4 py-2.5 font-medium">Date</th>
                            <th className="text-left px-4 py-2.5 font-medium">Customer</th>
                            <th className="text-left px-4 py-2.5 font-medium">Invoice</th>
                            <th className="text-left px-4 py-2.5 font-medium">Status</th>
                            <th className="text-right px-4 py-2.5 font-medium">Total</th>
                            <th className="text-right px-4 py-2.5 font-medium">Paid</th>
                            <th className="text-right px-4 py-2.5 font-medium">Balance</th>
                            <th className="text-right px-4 py-2.5 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center text-slate-400 py-14">
                                    Loading…
                                </td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-14">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <IconInbox className="h-8 w-8" />
                                        <span className="text-sm">No sales match these filters.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sales.map((s) => (
                                <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                        {new Date(s.saleDate || s.createdAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-slate-800">{s.customer?.name}</div>
                                        <div className="text-xs text-slate-400">{s.customer?.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                                        {s.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-800 whitespace-nowrap">
                                        {money(s.billedAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-700 whitespace-nowrap">
                                        {money(s.amountPaid)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-red-600 whitespace-nowrap">
                                        {money(s.pendingAmount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(s)}
                                                disabled={deletingId === s._id}
                                                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                            >
                                                <IconTrash className="h-3.5 w-3.5" />
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="text-center text-slate-400 py-14 text-sm">Loading…</div>
                ) : sales.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400 py-14">
                        <IconInbox className="h-8 w-8" />
                        <span className="text-sm">No sales match these filters.</span>
                    </div>
                ) : (
                    sales.map((s) => (
                        <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-slate-900 truncate">{s.customer?.name}</div>
                                    <div className="text-xs text-slate-400">{s.customer?.phone}</div>
                                </div>
                                <StatusBadge status={s.status} />
                            </div>

                            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                                <span className="font-mono">{s.invoiceNumber}</span>
                                <span>{new Date(s.saleDate || s.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                                <div>
                                    <div className="text-[11px] text-slate-400">Total</div>
                                    <div className="text-sm font-medium text-slate-800">{money(s.billedAmount)}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-slate-400">Paid</div>
                                    <div className="text-sm font-medium text-emerald-700">{money(s.amountPaid)}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-slate-400">Balance</div>
                                    <div className="text-sm font-medium text-red-600">{money(s.pendingAmount)}</div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDelete(s)}
                                disabled={deletingId === s._id}
                                className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg border border-red-200 text-red-600 text-xs font-medium py-2 hover:bg-red-50 disabled:opacity-50"
                            >
                                <IconTrash className="h-3.5 w-3.5" />
                                {deletingId === s._id ? "Deleting…" : "Delete sale"}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-500 gap-3">
                    <span className="hidden sm:inline">
                        Page {pagination.page} of {pagination.pages} · {pagination.total} total
                    </span>
                    <span className="sm:hidden">
                        {pagination.page}/{pagination.pages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                            <IconChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>
                        <button
                            type="button"
                            disabled={page >= pagination.pages}
                            onClick={() => setPage((p) => p + 1)}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <IconChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}