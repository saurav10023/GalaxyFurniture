// src/components/admin/payments/CustomerDetailDrawer.jsx
import { useCallback, useEffect, useState } from "react";
import { getCustomerById } from "../../../api/admin/customers.api";
import RecordPaymentModal from "./RecordPaymentModal";

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

// customerId: which customer to show
// onClose(): dismiss the drawer
// onPaymentRecorded(): notify the parent (e.g. PaymentsDue page) to refresh
//   the customers-due list, since this customer's balance just changed
export default function CustomerDetailDrawer({ customerId, onClose, onPaymentRecorded }) {
    const [data, setData] = useState(null); // { customer, sales, payments }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payingSale, setPayingSale] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCustomerById(customerId);
            setData(result);
        } catch {
            setError("Couldn't load this customer's profile.");
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        load();
    }, [load]);

    const handlePaymentRecorded = () => {
        setPayingSale(null);
        load(); // refresh this drawer's sales/payments/balance
        onPaymentRecorded?.(); // refresh the customers-due list behind it
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                    <h2 className="text-base font-semibold text-slate-800">Customer profile</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                        ×
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-slate-400 py-12 text-center">Loading…</p>
                ) : error ? (
                    <p className="text-sm text-red-600 py-12 text-center">{error}</p>
                ) : (
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">{data.customer.name}</h3>
                            <p className="text-sm text-slate-500">{data.customer.phone}</p>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400">Total spent</div>
                                    <div className="text-sm font-semibold text-slate-800">{money(data.customer.totalSpent)}</div>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="text-xs text-slate-400">Purchases</div>
                                    <div className="text-sm font-semibold text-slate-800">{data.customer.totalPurchases}</div>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-3">
                                    <div className="text-xs text-amber-600">Pending</div>
                                    <div className="text-sm font-semibold text-amber-700">
                                        {money(data.customer.pendingBalance)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Sales history</h4>
                            {data.sales.length === 0 ? (
                                <p className="text-sm text-slate-400">No sales yet.</p>
                            ) : (
                                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                                    {data.sales.map((sale) => (
                                        <div key={sale._id} className="flex items-center gap-3 px-3 py-2.5">
                                            <div className="flex-1">
                                                <div className="text-sm font-mono text-slate-700">{sale.invoiceNumber}</div>
                                                <div className="text-xs text-slate-400">
                                                    {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-800">{money(sale.billedAmount)}</div>
                                                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[sale.status]}`}>
                                                    {STATUS_LABELS[sale.status]}
                                                </span>
                                            </div>
                                            {sale.status !== "paid" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPayingSale(sale)}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                                                >
                                                    Record payment
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Payment history</h4>
                            {data.payments.length === 0 ? (
                                <p className="text-sm text-slate-400">No payments recorded yet.</p>
                            ) : (
                                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                                    {data.payments.map((p) => (
                                        <div key={p._id} className="flex items-center gap-3 px-3 py-2 text-sm">
                                            <span className="text-slate-500 w-24">
                                                {new Date(p.paidOn).toLocaleDateString("en-IN")}
                                            </span>
                                            <span className="flex-1 text-slate-400 text-xs">
                                                {p.sale?.invoiceNumber} · {MODE_LABELS[p.mode]}
                                                {p.note ? ` · ${p.note}` : ""}
                                            </span>
                                            <span className="font-medium text-emerald-700">{money(p.amount)}</span>
                                        </div>
                                    ))}
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
                    onRecorded={handlePaymentRecorded}
                />
            )}
        </div>
    );
}