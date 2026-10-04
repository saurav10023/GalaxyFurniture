// src/components/admin/payments/RecordPaymentModal.jsx
import { useState } from "react";
import { recordPayment } from "../../../api/admin/payments.api";
import { IconClose } from "../icons/AdminIcons";
import Select from "../../ui/Select";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={submitting ? undefined : onClose} />
            {/* Near-opaque cream glass, per the dropdown/info-card spec */}
            <div className="relative w-full max-w-sm bg-card/95 backdrop-blur-xl border border-line rounded-3xl shadow-[0_24px_48px_-20px_rgba(42,37,31,0.35)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                    <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold text-ink">Record payment</h3>
                        <p className="text-xs text-stone mt-0.5 truncate">
                            Invoice {sale.invoiceNumber} · Due {money(sale.pendingAmount)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="text-stone hover:text-ink hover:bg-linen p-1.5 -mr-1.5 rounded-full disabled:opacity-40 shrink-0 transition-colors"
                        aria-label="Close"
                    >
                        <IconClose className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className={labelClasses}>Amount</label>
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
                        <label className={labelClasses}>Date paid</label>
                        <input
                            type="date"
                            value={paidOn}
                            max={todayInputValue()}
                            onChange={(e) => setPaidOn(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>Payment mode</label>
                        <Select value={mode} onChange={setMode} options={MODE_OPTIONS} fullWidth />
                    </div>

                    <div>
                        <label className={labelClasses}>Note (optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. paid in person"
                            className={fieldClasses}
                        />
                    </div>

                    {error && <p className="text-xs text-red-700">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-full px-4 py-2 text-sm font-medium text-stone hover:bg-linen hover:text-ink disabled:opacity-40 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-moss px-5 py-2 text-sm font-medium text-card hover:bg-moss/90 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? "Saving…" : "Record payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}