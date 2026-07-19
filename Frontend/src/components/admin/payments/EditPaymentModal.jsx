// src/components/admin/payments/EditPaymentModal.jsx
import { useState } from "react";
import { updatePayment } from "../../../api/admin/payments.api";
import { IconClose } from "../icons/AdminIcons";

const MODE_OPTIONS = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "other", label: "Other" }
];

const fieldClasses =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

const toDateInputValue = (date) => new Date(date).toISOString().slice(0, 10);

// payment: the existing payment doc being edited
// onClose(): dismiss without saving
// onUpdated(): notify parent to refresh sale/payment/balance data
export default function EditPaymentModal({ payment, onClose, onUpdated }) {
    const [amount, setAmount] = useState(String(payment.amount));
    const [paidOn, setPaidOn] = useState(toDateInputValue(payment.paidOn));
    const [mode, setMode] = useState(payment.mode);
    const [note, setNote] = useState(payment.note || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0) {
            setError("Enter a valid amount.");
            return;
        }

        setSaving(true);
        try {
            await updatePayment(payment._id, {
                amount: numericAmount,
                paidOn,
                mode,
                note: note.trim()
            });
            onUpdated();
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't update this payment.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={saving ? undefined : onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-sm rounded-xl bg-white shadow-xl"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800">Edit payment</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded disabled:opacity-40"
                        aria-label="Close"
                    >
                        <IconClose className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Paid on</label>
                        <input
                            type="date"
                            value={paidOn}
                            onChange={(e) => setPaidOn(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Mode</label>
                        <select value={mode} onChange={(e) => setMode(e.target.value)} className={fieldClasses}>
                            {MODE_OPTIONS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
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
                            className={fieldClasses}
                        />
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}