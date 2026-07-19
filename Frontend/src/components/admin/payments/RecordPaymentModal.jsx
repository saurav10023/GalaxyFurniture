// src/components/admin/payments/RecordPaymentModal.jsx
import { useState } from "react";
import { recordPayment } from "../../../api/admin/payments.api";
import { IconClose } from "../icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const MODE_OPTIONS = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "other", label: "Other" }
];

const fieldClasses =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

function todayInputValue() {
    return new Date().toISOString().slice(0, 10);
}

// sale: the sale being paid down (needs _id, invoiceNumber, pendingAmount)
// onClose(): dismiss without saving
// onRecorded(): tell the parent (CustomerDetailDrawer) a payment was saved
export default function RecordPaymentModal({ sale, onClose, onRecorded }) {
    const [amount, setAmount] = useState(sale.pendingAmount);
    const [paidOn, setPaidOn] = useState(todayInputValue());
    const [mode, setMode] = useState("cash");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0) {
            setError("Enter a payment amount greater than 0.");
            return;
        }
        if (numericAmount > sale.pendingAmount) {
            setError(`Amount can't exceed the pending balance of ${money(sale.pendingAmount)}.`);
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await recordPayment(sale._id, {
                amount: numericAmount,
                paidOn: paidOn ? new Date(paidOn).toISOString() : undefined,
                mode,
                note: note.trim() || undefined
            });
            onRecorded?.();
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't record this payment.");
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={submitting ? undefined : onClose} />
            <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800">Record payment</h3>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                            Invoice {sale.invoiceNumber} · Due {money(sale.pendingAmount)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded disabled:opacity-40 shrink-0"
                        aria-label="Close"
                    >
                        <IconClose className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                        <input
                            type="number"
                            min="1"
                            max={sale.pendingAmount}
                            step="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Date paid</label>
                        <input
                            type="date"
                            value={paidOn}
                            max={todayInputValue()}
                            onChange={(e) => setPaidOn(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Payment mode</label>
                        <select value={mode} onChange={(e) => setMode(e.target.value)} className={fieldClasses}>
                            {MODE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Note (optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. paid in person"
                            className={fieldClasses}
                        />
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Record payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}