// src/components/admin/payments/PaymentsDueTable.jsx
import { useEffect, useState } from "react";
import { getAllCustomers } from "../../../api/admin/customers.api";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// refreshKey: bump this from the parent to refetch (e.g. after a payment is recorded)
// onSelectCustomer(customerId): open that customer's detail drawer
export default function PaymentsDueTable({ refreshKey, onSelectCustomer }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getAllCustomers({
                    pendingOnly: "true",
                    sortBy: "totalSpent",
                    limit: 50
                });
                if (!cancelled) setCustomers(data.customers || []);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.response?.data?.message || "Couldn't load customers with dues.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Customers with dues</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sorted by lifetime spend. Click a row for details.</p>
            </div>

            {loading ? (
                <div className="px-5 py-8 text-sm text-slate-500 text-center">Loading…</div>
            ) : error ? (
                <div className="px-5 py-8 text-sm text-red-600 text-center">{error}</div>
            ) : customers.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500 text-center">
                    No outstanding balances right now.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                                <th className="px-5 py-2.5">Customer</th>
                                <th className="px-5 py-2.5 text-right">Total spent</th>
                                <th className="px-5 py-2.5 text-right">Purchases</th>
                                <th className="px-5 py-2.5 text-right">Pending</th>
                                <th className="px-5 py-2.5">Last purchase</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customers.map((customer) => (
                                <tr
                                    key={customer._id}
                                    onClick={() => onSelectCustomer(customer._id)}
                                    className="cursor-pointer hover:bg-slate-50"
                                >
                                    <td className="px-5 py-3">
                                        <div className="text-slate-900 font-medium">{customer.name}</div>
                                        <div className="text-xs text-slate-500">{customer.phone}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right text-slate-600">
                                        {money(customer.totalSpent)}
                                    </td>
                                    <td className="px-5 py-3 text-right text-slate-600">
                                        {customer.totalPurchases}
                                    </td>
                                    <td className="px-5 py-3 text-right font-semibold text-amber-700">
                                        {money(customer.pendingBalance)}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                                        {customer.lastPurchaseDate
                                            ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}