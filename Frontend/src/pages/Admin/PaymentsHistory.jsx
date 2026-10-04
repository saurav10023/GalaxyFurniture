// src/pages/admin/PaymentsHistory.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { getAllPayments, deletePayment } from "../../api/admin/payments.api";
import EditPaymentModal from "../../components/admin/payments/EditPaymentModal";
import {
    IconSearch,
    IconInbox,
    IconTrash,
    IconEdit,
    IconChevronLeft,
    IconChevronRight,
    IconFilterX
} from "../../components/admin/icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const MODE_LABELS = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer: "Bank transfer",
    other: "Other"
};

const MODE_OPTIONS = [
    { value: "", label: "All modes" },
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "other", label: "Other" }
];

// ---- soft glass surfaces, kept quiet for admin use ----------------------------
const GLASS =
    "bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_-16px_rgba(80,60,30,0.35)]";

// 16px on phones stops iOS from zooming in when a field is tapped
const fieldClasses =
    "rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-[16px] sm:text-sm text-ink placeholder:text-stone/60 " +
    "focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-moss/30 focus:border-moss/50 transition-all duration-200";

const pagerBtn =
    `flex items-center gap-1 rounded-full px-3.5 py-2 text-ink/80 hover:text-moss ${GLASS} transition-all duration-200 hover:-translate-y-0.5 ` +
    "disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:text-ink/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss";

const editBtn =
    "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-moss hover:bg-moss/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-moss";
const deleteBtn =
    "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#9A3F28] hover:bg-[#B5533A]/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B5533A]";

export default function PaymentsHistory() {
    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const [editingPayment, setEditingPayment] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const debounceRef = useRef(null);
    const hasFilters = Boolean(search || mode || dateFrom || dateTo);

    // Debounce the free-text search box; other filters apply immediately.
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [searchInput]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAllPayments({
                search: search || undefined,
                mode: mode || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                page,
                limit: 20
            });
            setPayments(result.payments);
            setPagination(result.pagination);
        } catch {
            setError("Couldn't load payments.");
        } finally {
            setLoading(false);
        }
    }, [search, mode, dateFrom, dateTo, page]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (payment) => {
        const confirmed = window.confirm(
            `Delete this ${money(payment.amount)} payment on ${payment.sale?.invoiceNumber}? ` +
                `This reverses the amount back onto the sale and customer balance.`
        );
        if (!confirmed) return;

        setDeletingId(payment._id);
        try {
            await deletePayment(payment._id);
            load();
        } catch {
            setError("Couldn't delete that payment.");
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
        setSearchInput("");
        setSearch("");
        setMode("");
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="font-serif font-medium text-[1.6rem] sm:text-[2rem] leading-tight text-ink">
                    Payment history
                </h1>
                <p className="text-sm text-stone mt-0.5">
                    Every payment ever recorded, across all customers and sales.
                </p>
            </div>

            {/* Filters */}
            <div className={`rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 ${GLASS}`}>
                <div className="relative flex-1 min-w-[220px]">
                    <IconSearch className="h-4 w-4 text-stone absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by customer name, phone, or invoice…"
                        className={`${fieldClasses} w-full pl-9`}
                    />
                </div>
                <select
                    value={mode}
                    onChange={(e) => changeFilter(setMode)(e.target.value)}
                    className={`${fieldClasses} flex-1 min-w-[130px] sm:flex-none`}
                >
                    {MODE_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
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
                            <th className="text-left px-4 py-3 font-medium">Mode</th>
                            <th className="text-right px-4 py-3 font-medium">Amount</th>
                            <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center text-stone py-14">
                                    Loading…
                                </td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-14">
                                    <div className="flex flex-col items-center gap-2 text-stone">
                                        <IconInbox className="h-8 w-8 text-clay/70" />
                                        <span className="text-sm">No payments match these filters.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            payments.map((p) => (
                                <tr key={p._id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-4 py-3 text-ink/70 whitespace-nowrap">
                                        {new Date(p.paidOn).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-ink">{p.customer?.name}</div>
                                        <div className="text-xs text-stone">{p.customer?.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-ink/70 whitespace-nowrap">
                                        {p.sale?.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-3 text-ink/70">{MODE_LABELS[p.mode]}</td>
                                    <td className="px-4 py-3 text-right font-medium text-[#3F6B30] whitespace-nowrap">
                                        {money(p.amount)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-end gap-1">
                                            <button type="button" onClick={() => setEditingPayment(p)} className={editBtn}>
                                                <IconEdit className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(p)}
                                                disabled={deletingId === p._id}
                                                className={deleteBtn}
                                            >
                                                <IconTrash className="h-3.5 w-3.5" />
                                                {deletingId === p._id ? "Deleting…" : "Delete"}
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
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-stone py-14">
                        <IconInbox className="h-8 w-8 text-clay/70" />
                        <span className="text-sm">No payments match these filters.</span>
                    </div>
                ) : (
                    payments.map((p) => (
                        <div key={p._id} className={`rounded-2xl p-4 ${GLASS}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-ink truncate">{p.customer?.name}</div>
                                    <div className="text-xs text-stone">{p.customer?.phone}</div>
                                </div>
                                <span className="text-sm font-semibold text-[#3F6B30] whitespace-nowrap">
                                    {money(p.amount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between mt-3 text-xs text-stone">
                                <span className="font-mono">{p.sale?.invoiceNumber}</span>
                                <span>{new Date(p.paidOn).toLocaleDateString("en-IN")}</span>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink/10">
                                <span className="text-xs text-stone">{MODE_LABELS[p.mode]}</span>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => setEditingPayment(p)} className={editBtn}>
                                        <IconEdit className="h-3.5 w-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(p)}
                                        disabled={deletingId === p._id}
                                        className={deleteBtn}
                                    >
                                        <IconTrash className="h-3.5 w-3.5" />
                                        {deletingId === p._id ? "Deleting…" : "Delete"}
                                    </button>
                                </div>
                            </div>
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

            {editingPayment && (
                <EditPaymentModal
                    payment={editingPayment}
                    onClose={() => setEditingPayment(null)}
                    onUpdated={() => {
                        setEditingPayment(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}