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
            <div className="rounded-3xl border border-line bg-card p-3">
                <div className="relative">
                    <IconSearch className="h-4 w-4 text-stone absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search customers with dues…"
                        className="w-full rounded-full border border-line bg-card pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-line bg-card overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-line">
                    <h2 className="font-display text-xl font-semibold text-ink">Customers with dues</h2>
                    <p className="text-xs text-stone mt-0.5">Sorted by lifetime spend. Tap a row for details.</p>
                </div>

                {loading ? (
                    <div className="px-5 py-14 text-sm text-stone text-center">Loading…</div>
                ) : error ? (
                    <div className="px-5 py-14 text-sm text-red-700 text-center">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-stone py-14">
                        <IconInbox className="h-8 w-8 text-clay" />
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
                                    <tr className="text-left text-[11px] font-medium text-stone uppercase tracking-[0.15em] bg-linen/60">
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3 text-right">Total spent</th>
                                        <th className="px-6 py-3 text-right">Purchases</th>
                                        <th className="px-6 py-3 text-right">Pending</th>
                                        <th className="px-6 py-3">Last purchase</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filtered.map((customer) => (
                                        <tr
                                            key={customer._id}
                                            onClick={() => onSelectCustomer(customer._id)}
                                            className="cursor-pointer hover:bg-linen/50 transition-colors"
                                        >
                                            <td className="px-6 py-3.5">
                                                <div className="text-ink font-medium">{customer.name}</div>
                                                <div className="text-xs text-stone">{customer.phone}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-stone whitespace-nowrap">
                                                {money(customer.totalSpent)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-stone">
                                                {customer.totalPurchases}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-semibold text-clay-deep whitespace-nowrap">
                                                {money(customer.pendingBalance)}
                                            </td>
                                            <td className="px-6 py-3.5 text-stone whitespace-nowrap">
                                                {customer.lastPurchaseDate
                                                    ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <IconChevronRight className="h-4 w-4 text-clay inline-block" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-line">
                            {filtered.map((customer) => (
                                <button
                                    key={customer._id}
                                    type="button"
                                    onClick={() => onSelectCustomer(customer._id)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-linen/50 active:bg-linen"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-ink truncate">{customer.name}</div>
                                        <div className="text-xs text-stone">{customer.phone}</div>
                                        <div className="text-xs text-stone mt-0.5">
                                            {customer.totalPurchases} purchase{customer.totalPurchases === 1 ? "" : "s"} ·{" "}
                                            {customer.lastPurchaseDate
                                                ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
                                                : "—"}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-semibold text-clay-deep">
                                            {money(customer.pendingBalance)}
                                        </div>
                                        <div className="text-[11px] text-stone">pending</div>
                                    </div>
                                    <IconChevronRight className="h-4 w-4 text-clay shrink-0" />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}