// src/components/admin/payments/PaymentsDueTable.jsx
import { useEffect, useMemo, useState } from "react";
import { getAllCustomers } from "../../../api/admin/customers.api";
import { IconSearch, IconInbox, IconChevronRight } from "../icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// refreshKey: bump this from the parent to refetch (e.g. after a payment is recorded)
// onSelectCustomer(customerId): open that customer's detail drawer
export default function PaymentsDueTable({ refreshKey, onSelectCustomer }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

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

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter(
            (c) => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
        );
    }, [customers, search]);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="relative">
                    <IconSearch className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search customers with dues…"
                        className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Customers with dues</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Sorted by lifetime spend. Tap a row for details.</p>
                </div>

                {loading ? (
                    <div className="px-5 py-14 text-sm text-slate-400 text-center">Loading…</div>
                ) : error ? (
                    <div className="px-5 py-14 text-sm text-red-600 text-center">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400 py-14">
                        <IconInbox className="h-8 w-8" />
                        <span className="text-sm">
                            {customers.length === 0 ? "No outstanding balances right now." : "No customers match your search."}
                        </span>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50">
                                        <th className="px-5 py-2.5">Customer</th>
                                        <th className="px-5 py-2.5 text-right">Total spent</th>
                                        <th className="px-5 py-2.5 text-right">Purchases</th>
                                        <th className="px-5 py-2.5 text-right">Pending</th>
                                        <th className="px-5 py-2.5">Last purchase</th>
                                        <th className="px-5 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((customer) => (
                                        <tr
                                            key={customer._id}
                                            onClick={() => onSelectCustomer(customer._id)}
                                            className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="text-slate-900 font-medium">{customer.name}</div>
                                                <div className="text-xs text-slate-500">{customer.phone}</div>
                                            </td>
                                            <td className="px-5 py-3 text-right text-slate-600 whitespace-nowrap">
                                                {money(customer.totalSpent)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-slate-600">
                                                {customer.totalPurchases}
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-amber-700 whitespace-nowrap">
                                                {money(customer.pendingBalance)}
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                                                {customer.lastPurchaseDate
                                                    ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
                                                    : "—"}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <IconChevronRight className="h-4 w-4 text-slate-300 inline-block" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filtered.map((customer) => (
                                <button
                                    key={customer._id}
                                    type="button"
                                    onClick={() => onSelectCustomer(customer._id)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-slate-900 truncate">{customer.name}</div>
                                        <div className="text-xs text-slate-400">{customer.phone}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {customer.totalPurchases} purchase{customer.totalPurchases === 1 ? "" : "s"} ·{" "}
                                            {customer.lastPurchaseDate
                                                ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
                                                : "—"}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-semibold text-amber-700">
                                            {money(customer.pendingBalance)}
                                        </div>
                                        <div className="text-[11px] text-slate-400">pending</div>
                                    </div>
                                    <IconChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}