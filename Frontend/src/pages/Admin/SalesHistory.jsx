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

// Muted earthy status colours: sage / oak / terracotta
const STATUS_STYLES = {
    paid: "bg-[#7FA06A]/15 text-[#3F6B30]",
    partially_paid: "bg-[#D1A671]/25 text-[#8A6338]",
    pending: "bg-[#B5533A]/10 text-[#9A3F28]"
};

const STATUS_DOTS = {
    paid: "bg-[#6E9559]",
    partially_paid: "bg-[#C08F55]",
    pending: "bg-[#B5533A]"
};

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "paid", label: "Paid" },
    { value: "partially_paid", label: "Partially paid" },
    { value: "pending", label: "Due" }
];

// ---- soft glass surfaces, kept quiet for admin use ----------------------------
const GLASS =
    "bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_-16px_rgba(80,60,30,0.35)]";

// 16px on phones stops iOS from zooming in when a field is tapped
const fieldClasses =
    "rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-[16px] sm:text-sm text-ink " +
    "focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-moss/30 focus:border-moss/50 transition-all duration-200";

const pagerBtn =
    `flex items-center gap-1 rounded-full px-3.5 py-2 text-ink/80 hover:text-moss ${GLASS} transition-all duration-200 hover:-translate-y-0.5 ` +
    "disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:text-ink/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss";

const deleteBtn =
    "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#9A3F28] hover:bg-[#B5533A]/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B5533A]";

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_STYLES[status] || "bg-ink/5 text-stone"
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] || "bg-stone/50"}`} />
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
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="font-serif font-medium text-[1.6rem] sm:text-[2rem] leading-tight text-ink">
                    Sales history
                </h1>
                <p className="text-sm text-stone mt-0.5">Every sale ever recorded, across all customers.</p>
            </div>

            {/* Filters */}
            <div className={`rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 ${GLASS}`}>
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
                        className="flex items-center gap-1.5 rounded-full text-sm font-medium text-ink/70 hover:text-moss hover:bg-white/70 px-3.5 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                    >
                        <IconFilterX className="h-4 w-4" />
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="rounded-2xl border border-[#B5533A]/30 bg-[#B5533A]/10 px-4 py-3 text-sm text-[#9A3F28]">
                    {error}
                </div>
            )}

            {/* Desktop table */}
            <div className={`hidden md:block rounded-2xl overflow-hidden ${GLASS}`}>
                <table className="w-full text-sm">
                    <thead className="bg-white/40 text-xs text-stone uppercase tracking-wide">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium">Date</th>
                            <th className="text-left px-4 py-3 font-medium">Customer</th>
                            <th className="text-left px-4 py-3 font-medium">Invoice</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-right px-4 py-3 font-medium">Total</th>
                            <th className="text-right px-4 py-3 font-medium">Paid</th>
                            <th className="text-right px-4 py-3 font-medium">Balance</th>
                            <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center text-stone py-14">
                                    Loading…
                                </td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-14">
                                    <div className="flex flex-col items-center gap-2 text-stone">
                                        <IconInbox className="h-8 w-8 text-clay/70" />
                                        <span className="text-sm">No sales match these filters.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sales.map((s) => (
                                <tr key={s._id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-4 py-3 text-ink/70 whitespace-nowrap">
                                        {new Date(s.saleDate || s.createdAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-ink">{s.customer?.name}</div>
                                        <div className="text-xs text-stone">{s.customer?.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-ink/70 whitespace-nowrap">
                                        {s.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right text-ink whitespace-nowrap">
                                        {money(s.billedAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-[#3F6B30] whitespace-nowrap">
                                        {money(s.amountPaid)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-[#9A3F28] whitespace-nowrap">
                                        {money(s.pendingAmount)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(s)}
                                                disabled={deletingId === s._id}
                                                className={deleteBtn}
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
                    <div className="text-center text-stone py-14 text-sm">Loading…</div>
                ) : sales.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-stone py-14">
                        <IconInbox className="h-8 w-8 text-clay/70" />
                        <span className="text-sm">No sales match these filters.</span>
                    </div>
                ) : (
                    sales.map((s) => (
                        <div key={s._id} className={`rounded-2xl p-4 ${GLASS}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-ink truncate">{s.customer?.name}</div>
                                    <div className="text-xs text-stone">{s.customer?.phone}</div>
                                </div>
                                <StatusBadge status={s.status} />
                            </div>

                            <div className="flex items-center justify-between mt-3 text-xs text-stone">
                                <span className="font-mono">{s.invoiceNumber}</span>
                                <span>{new Date(s.saleDate || s.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ink/10 text-center">
                                <div>
                                    <div className="text-[11px] text-stone">Total</div>
                                    <div className="text-sm font-medium text-ink">{money(s.billedAmount)}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-stone">Paid</div>
                                    <div className="text-sm font-medium text-[#3F6B30]">{money(s.amountPaid)}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-stone">Balance</div>
                                    <div className="text-sm font-medium text-[#9A3F28]">{money(s.pendingAmount)}</div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDelete(s)}
                                disabled={deletingId === s._id}
                                className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-full border border-[#B5533A]/30 text-[#9A3F28] text-xs font-medium py-2.5 hover:bg-[#B5533A]/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B5533A]"
                            >
                                <IconTrash className="h-3.5 w-3.5" />
                                {deletingId === s._id ? "Deleting…" : "Delete sale"}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between text-sm text-stone gap-3">
                    <span className="hidden sm:inline">
                        Page {pagination.page} of {pagination.pages} · {pagination.total} total
                    </span>
                    <span className="sm:hidden">
                        {pagination.page}/{pagination.pages}
                    </span>
                    <div className="flex gap-2">
                        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={pagerBtn}>
                            <IconChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>
                        <button
                            type="button"
                            disabled={page >= pagination.pages}
                            onClick={() => setPage((p) => p + 1)}
                            className={pagerBtn}
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