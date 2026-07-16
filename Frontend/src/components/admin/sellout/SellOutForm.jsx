// src/components/admin/sellout/SellOutForm.jsx
//
// Product search here uses the plain admin product listing filtered
// client-side (same stopgap as CategoryProductsBoard) since
// search.controller.js hasn't been reviewed yet. Swap for a real
// server-side search once that's available and the catalog grows.
//
// createSale takes amountPaidNow/paymentMode directly and handles the
// initial Payment record server-side in the same transaction — no
// follow-up recordPayment() call needed (confirmed against sale.controller.js).

import { useEffect, useMemo, useState } from "react";
import { getAllProducts } from "../../../api/admin/products.api";
import { createSale } from "../../../api/admin/sellout.api";
import CustomerSelect from "./CustomerSelect";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function SellOutForm({ onSaleCreated }) {
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [productQuery, setProductQuery] = useState("");
    const [lineItems, setLineItems] = useState([]); // [{ product, quantity }]
    const [customerSelection, setCustomerSelection] = useState(null);
    const [amountReceived, setAmountReceived] = useState("");
    const [paymentMode, setPaymentMode] = useState("cash");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            setCatalogLoading(true);
            try {
                const { products } = await getAllProducts({ limit: 300 });
                setCatalog(products.filter((p) => p.isActive));
            } catch {
                setError("Couldn't load products for sale.");
            } finally {
                setCatalogLoading(false);
            }
        })();
    }, []);

    const searchResults = useMemo(() => {
        if (!productQuery.trim()) return [];
        const q = productQuery.trim().toLowerCase();
        return catalog
            .filter(
                (p) =>
                    !lineItems.some((li) => li.product._id === p._id) &&
                    (p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
            )
            .slice(0, 8);
    }, [productQuery, catalog, lineItems]);

    const addLineItem = (product) => {
        setLineItems((prev) => [...prev, { product, quantity: 1 }]);
        setProductQuery("");
    };

    const updateQuantity = (productId, quantity) => {
        const qty = Math.max(1, Math.round(Number(quantity)) || 1); // backend requires an integer >= 1
        setLineItems((prev) => prev.map((li) => (li.product._id === productId ? { ...li, quantity: qty } : li)));
    };

    const removeLineItem = (productId) => {
        setLineItems((prev) => prev.filter((li) => li.product._id !== productId));
    };

    const billedAmount = lineItems.reduce(
        (sum, li) => sum + li.product.pricing.sellingPrice * li.quantity,
        0
    );

    const validate = () => {
        if (lineItems.length === 0) return "Add at least one product.";
        if (!customerSelection) return "Select or add a customer.";
        for (const li of lineItems) {
            if (li.quantity > li.product.stock.current) {
                return `Only ${li.product.stock.current} left of "${li.product.name}".`;
            }
        }
        if (amountReceived && Number(amountReceived) > billedAmount) {
            return "Amount received can't exceed the billed amount.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        try {
            const sale = await createSale({
                ...customerSelection, // { customerName, customerPhone }
                items: lineItems.map((li) => ({ product: li.product._id, quantity: li.quantity })),
                amountPaidNow: amountReceived ? Number(amountReceived) : undefined,
                paymentMode: amountReceived ? paymentMode : undefined,
                notes: notes.trim() || undefined
            });

            setLineItems([]);
            setCustomerSelection(null);
            setAmountReceived("");
            setNotes("");
            onSaleCreated?.(sale);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to record sale. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">Record a sale</h2>
                <p className="text-sm text-slate-500 mt-0.5">Add products, pick a customer, and check out.</p>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Add products</label>
                <div className="relative">
                    <input
                        type="text"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder={catalogLoading ? "Loading catalog…" : "Search by name or SKU…"}
                        disabled={catalogLoading}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 rounded-md border border-slate-200 bg-white shadow-sm max-h-56 overflow-auto">
                            {searchResults.map((p) => (
                                <li key={p._id}>
                                    <button
                                        type="button"
                                        onClick={() => addLineItem(p)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        <span>
                                            {p.name} <span className="text-slate-400">· {p.stock.current} in stock</span>
                                        </span>
                                        <span className="font-medium">{money(p.pricing.sellingPrice)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {lineItems.length > 0 && (
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {lineItems.map((li) => (
                        <div key={li.product._id} className="flex items-center gap-3 px-3 py-2">
                            <span className="flex-1 text-sm text-slate-700">{li.product.name}</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                max={li.product.stock.current}
                                value={li.quantity}
                                onChange={(e) => updateQuantity(li.product._id, e.target.value)}
                                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-center"
                            />
                            <span className="w-24 text-right text-sm font-medium text-slate-800">
                                {money(li.product.pricing.sellingPrice * li.quantity)}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeLineItem(li.product._id)}
                                className="text-slate-400 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div className="flex justify-between px-3 py-2 text-sm font-semibold text-slate-800">
                        <span>Total</span>
                        <span>{money(billedAmount)}</span>
                    </div>
                </div>
            )}

            <CustomerSelect onChange={setCustomerSelection} />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Amount received now <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={billedAmount || undefined}
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="Leave blank if unpaid"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment mode</label>
                    <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        disabled={!amountReceived}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank transfer</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? "Recording…" : `Record sale · ${money(billedAmount)}`}
                </button>
            </div>
        </form>
    );
}