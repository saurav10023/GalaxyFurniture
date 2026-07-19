// src/components/admin/payments/CustomerDetailDrawer.jsx
import { useCallback, useEffect, useState } from "react";
import { getCustomerById } from "../../../api/admin/customers.api";
import RecordPaymentModal from "./RecordPaymentModal";
import EditPaymentModal from "./EditPaymentModal";
import { IconClose, IconChevronDown, IconPlus, IconEdit } from "../icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_STYLES = {
    paid: "bg-emerald-100 text-emerald-700",
    partially_paid: "bg-amber-100 text-amber-700",
    pending: "bg-red-100 text-red-700"
};
const STATUS_LABELS = { paid: "Paid", partially_paid: "Partially paid", pending: "Pending" };

const MODE_LABELS = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer: "Bank transfer",
    other: "Other"
};

// A payment belongs to a sale whether `sale` came back populated (an object
// with an _id) or as a bare id string — match on whichever shape we got.
const paymentBelongsToSale = (payment, sale) => {
    const paymentSaleId = payment.sale?._id ?? payment.sale;
    return paymentSaleId === sale._id;
};

// customerId: which customer to show
// onClose(): dismiss the drawer
// onPaymentRecorded(): notify the parent (e.g. PaymentsDue page) to refresh
//   the customers-due list, since this customer's balance just changed
export default function CustomerDetailDrawer({ customerId, onClose, onPaymentRecorded }) {
    const [data, setData] = useState(null); // { customer, sales, payments }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payingSale, setPayingSale] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [expandedSaleId, setExpandedSaleId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCustomerById(customerId);
            setData(result);
            // Open the first sale with an outstanding balance by default so
            // the drawer isn't just a flat list of collapsed rows.
            setExpandedSaleId((prev) => prev ?? result.sales.find((s) => s.status !== "paid")?._id ?? null);
        } catch {
            setError("Couldn't load this customer's profile.");
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        load();
    }, [load]);

    // Shared refresh used after recording a new payment OR editing an
    // existing one — either action can change the customer's balance and
    // the sales/payments lists, so both routes through here.
    const refreshAfterChange = () => {
        setPayingSale(null);
        setEditingPayment(null);
        load(); // refresh this drawer's sales/payments/balance
        onPaymentRecorded?.(); // refresh the customers-due list behind it
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                    <h2 className="text-base font-semibold text-slate-800">Customer profile</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded"
                        aria-label="Close"
                    >
                        <IconClose className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-slate-400 py-16 text-center">Loading…</p>
                ) : error ? (
                    <p className="text-sm text-red-600 py-16 text-center">{error}</p>
                ) : (
                    <div className="p-5 sm:p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">{data.customer.name}</h3>
                            <p className="text-sm text-slate-500">{data.customer.phone}</p>

                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
                                <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400">Total spent</div>
                                    <div className="text-sm font-semibold text-slate-800">{money(data.customer.totalSpent)}</div>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400">Purchases</div>
                                    <div className="text-sm font-semibold text-slate-800">{data.customer.totalPurchases}</div>
                                </div>
                                <div
                                    className={`rounded-lg p-3 ${
                                        data.customer.pendingBalance > 0 ? "bg-amber-50" : "bg-emerald-50"
                                    }`}
                                >
                                    <div
                                        className={`text-xs ${
                                            data.customer.pendingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                                        }`}
                                    >
                                        {data.customer.pendingBalance > 0 ? "Pending" : "All dues cleared ✓"}
                                    </div>
                                    <div
                                        className={`text-sm font-semibold ${
                                            data.customer.pendingBalance > 0 ? "text-amber-700" : "text-emerald-700"
                                        }`}
                                    >
                                        {money(data.customer.pendingBalance)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Sales &amp; payments</h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Tap a sale to see its payments, or add a new one against it.
                            </p>

                            {data.sales.length === 0 ? (
                                <p className="text-sm text-slate-400">No sales yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.sales.map((sale) => {
                                        const isOpen = expandedSaleId === sale._id;
                                        const salePayments = data.payments.filter((p) => paymentBelongsToSale(p, sale));

                                        return (
                                            <div key={sale._id} className="rounded-lg border border-slate-200 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedSaleId(isOpen ? null : sale._id)}
                                                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50"
                                                >
                                                    <IconChevronDown
                                                        className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                                                            isOpen ? "rotate-180" : ""
                                                        }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-mono text-slate-700 truncate">
                                                            {sale.invoiceNumber}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(sale.saleDate).toLocaleDateString("en-IN")} ·{" "}
                                                            {salePayments.length} payment{salePayments.length === 1 ? "" : "s"}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-sm font-medium text-slate-800">
                                                            {money(sale.billedAmount)}
                                                        </div>
                                                        <span
                                                            className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[sale.status]}`}
                                                        >
                                                            {STATUS_LABELS[sale.status]}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isOpen && (
                                                    <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3 space-y-2">
                                                        {salePayments.length === 0 ? (
                                                            <p className="text-xs text-slate-400 px-1 py-1.5">
                                                                No payments recorded against this sale yet.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                {salePayments.map((p) => (
                                                                    <div
                                                                        key={p._id}
                                                                        className="flex items-center gap-2 sm:gap-3 rounded-md bg-white border border-slate-200 px-3 py-2 text-sm"
                                                                    >
                                                                        <span className="text-slate-500 text-xs w-16 sm:w-20 shrink-0">
                                                                            {new Date(p.paidOn).toLocaleDateString("en-IN")}
                                                                        </span>
                                                                        <span className="flex-1 text-slate-400 text-xs truncate">
                                                                            {MODE_LABELS[p.mode]}
                                                                            {p.note ? ` · ${p.note}` : ""}
                                                                        </span>
                                                                        <span className="font-medium text-emerald-700 shrink-0">
                                                                            {money(p.amount)}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditingPayment(p)}
                                                                            className="text-indigo-600 hover:text-indigo-700 shrink-0 p-1"
                                                                            aria-label="Edit payment"
                                                                        >
                                                                            <IconEdit className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {sale.status !== "paid" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPayingSale(sale)}
                                                                className="flex items-center justify-center gap-1.5 w-full rounded-md border border-indigo-200 bg-white text-indigo-600 text-xs font-medium py-2 hover:bg-indigo-50"
                                                            >
                                                                <IconPlus className="h-3.5 w-3.5" />
                                                                Add payment for this sale
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {payingSale && (
                <RecordPaymentModal
                    sale={payingSale}
                    onClose={() => setPayingSale(null)}
                    onRecorded={refreshAfterChange}
                />
            )}

            {editingPayment && (
                <EditPaymentModal
                    payment={editingPayment}
                    onClose={() => setEditingPayment(null)}
                    onUpdated={refreshAfterChange}
                />
            )}
        </div>
    );
}