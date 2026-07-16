import { useState } from "react";
import { updatePayment } from "../../../api/admin/payments.api";

const MODE_OPTIONS = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "other", label: "Other" }
];

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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">Edit payment</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                        ×
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Paid on</label>
                    <input
                        type="date"
                        value={paidOn}
                        onChange={(e) => setPaidOn(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                        {MODE_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Note (optional)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}