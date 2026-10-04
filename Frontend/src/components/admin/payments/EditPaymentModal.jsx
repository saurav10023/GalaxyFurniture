// src/components/admin/payments/EditPaymentModal.jsx
import { useState } from "react";
import { updatePayment } from "../../../api/admin/payments.api";
import { IconClose } from "../icons/AdminIcons";
import Select from "../../ui/Select";

const MODE_OPTIONS = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "other", label: "Other" }
];

const fieldClasses =
    "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss";
const labelClasses = "block text-xs font-medium text-stone mb-1.5";

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
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-sm rounded-3xl bg-card/95 backdrop-blur-xl border border-line shadow-[0_24px_48px_-20px_rgba(42,37,31,0.35)]"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                    <h3 className="font-display text-xl font-semibold text-ink">Edit payment</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="text-stone hover:text-ink hover:bg-linen p-1.5 -mr-1.5 rounded-full disabled:opacity-40 transition-colors"
                        aria-label="Close"
                    >
                        <IconClose className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className={labelClasses}>Amount</label>
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
                        <label className={labelClasses}>Paid on</label>
                        <input
                            type="date"
                            value={paidOn}
                            onChange={(e) => setPaidOn(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>Mode</label>
                        <Select value={mode} onChange={setMode} options={MODE_OPTIONS} fullWidth />
                    </div>

                    <div>
                        <label className={labelClasses}>Note (optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    {error && <p className="text-xs text-red-700">{error}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-full px-4 py-2 text-sm font-medium text-stone hover:bg-linen hover:text-ink disabled:opacity-40 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-moss px-5 py-2 text-sm font-medium text-card hover:bg-moss/90 disabled:opacity-50 transition-colors"
                        >
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}