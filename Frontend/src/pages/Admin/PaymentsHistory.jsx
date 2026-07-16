import { useCallback, useEffect, useRef, useState } from "react";
import { getAllPayments, deletePayment } from "../../api/admin/payments.api";
import EditPaymentModal from "../../components/admin/payments/EditPaymentModal";

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

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Payment history</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Every payment ever recorded, across all customers and sales.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by customer name, phone, or invoice…"
                    className="flex-1 min-w-[240px] rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                    value={mode}
                    onChange={(e) => changeFilter(setMode)(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                            <th className="text-left px-4 py-2.5">Mode</th>
                            <th className="text-right px-4 py-2.5">Amount</th>
                            <th className="text-right px-4 py-2.5">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center text-slate-400 py-10">
                                    Loading…
                                </td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-slate-400 py-10">
                                    No payments match these filters.
                                </td>
                            </tr>
                        ) : (
                            payments.map((p) => (
                                <tr key={p._id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 text-slate-600">
                                        {new Date(p.paidOn).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="text-slate-800">{p.customer?.name}</div>
                                        <div className="text-xs text-slate-400">{p.customer?.phone}</div>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-slate-600">
                                        {p.sale?.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600">{MODE_LABELS[p.mode]}</td>
                                    <td className="px-4 py-2.5 text-right font-medium text-emerald-700">
                                        {money(p.amount)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditingPayment(p)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(p)}
                                                disabled={deletingId === p._id}
                                                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                            >
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