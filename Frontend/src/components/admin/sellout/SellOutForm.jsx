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
import { IconSearch, IconPlus, IconMinus, IconTrash } from "../icons/AdminIcons";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fieldClasses =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

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

    const stepQuantity = (productId, delta) => {
        setLineItems((prev) =>
            prev.map((li) => {
                if (li.product._id !== productId) return li;
                const next = Math.min(li.product.stock.current, Math.max(1, li.quantity + delta));
                return { ...li, quantity: next };
            })
        );
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
        <form
            onSubmit={handleSubmit}
            className="relative rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6"
        >
            <div>
                <h2 className="text-lg font-semibold text-slate-800">Record a sale</h2>
                <p className="text-sm text-slate-500 mt-0.5">Add products, pick a customer, and check out.</p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Add products</label>
                <div className="relative">
                    <IconSearch className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder={catalogLoading ? "Loading catalog…" : "Search by name or SKU…"}
                        disabled={catalogLoading}
                        className={`${fieldClasses} pl-9 disabled:bg-slate-50 disabled:text-slate-400`}
                    />
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 rounded-lg border border-slate-200 bg-white shadow-md max-h-60 overflow-auto">
                            {searchResults.map((p) => (
                                <li key={p._id}>
                                    <button
                                        type="button"
                                        onClick={() => addLineItem(p)}
                                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-slate-50"
                                    >
                                        <span className="text-left min-w-0">
                                            <span className="text-slate-800 block truncate">{p.name}</span>
                                            <span className="text-xs text-slate-400">{p.stock.current} in stock</span>
                                        </span>
                                        <span className="font-medium text-slate-800 shrink-0">
                                            {money(p.pricing.sellingPrice)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {lineItems.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                    {/* Desktop row layout */}
                    <div className="hidden sm:block divide-y divide-slate-100">
                        {lineItems.map((li) => (
                            <div key={li.product._id} className="flex items-center gap-3 px-3 py-2.5">
                                <span className="flex-1 text-sm text-slate-700 truncate">{li.product.name}</span>
                                <div className="flex items-center gap-1 rounded-lg border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => stepQuantity(li.product._id, -1)}
                                        className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                        disabled={li.quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        <IconMinus className="h-3.5 w-3.5" />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        max={li.product.stock.current}
                                        value={li.quantity}
                                        onChange={(e) => updateQuantity(li.product._id, e.target.value)}
                                        className="w-10 text-center text-sm border-0 focus:outline-none focus:ring-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => stepQuantity(li.product._id, 1)}
                                        className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                        disabled={li.quantity >= li.product.stock.current}
                                        aria-label="Increase quantity"
                                    >
                                        <IconPlus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <span className="w-24 text-right text-sm font-medium text-slate-800">
                                    {money(li.product.pricing.sellingPrice * li.quantity)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeLineItem(li.product._id)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                    aria-label="Remove item"
                                >
                                    <IconTrash className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Mobile card layout */}
                    <div className="sm:hidden divide-y divide-slate-100">
                        {lineItems.map((li) => (
                            <div key={li.product._id} className="px-3 py-3">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm text-slate-800 flex-1 min-w-0">{li.product.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(li.product._id)}
                                        className="text-slate-400 hover:text-red-500 p-0.5 shrink-0"
                                        aria-label="Remove item"
                                    >
                                        <IconTrash className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => stepQuantity(li.product._id, -1)}
                                            className="p-2 text-slate-500 disabled:opacity-30"
                                            disabled={li.quantity <= 1}
                                            aria-label="Decrease quantity"
                                        >
                                            <IconMinus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-sm">{li.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => stepQuantity(li.product._id, 1)}
                                            className="p-2 text-slate-500 disabled:opacity-30"
                                            disabled={li.quantity >= li.product.stock.current}
                                            aria-label="Increase quantity"
                                        >
                                            <IconPlus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800">
                                        {money(li.product.pricing.sellingPrice * li.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50">
                        <span>Total</span>
                        <span>{money(billedAmount)}</span>
                    </div>
                </div>
            )}

            <CustomerSelect onChange={setCustomerSelection} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Amount received now <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={billedAmount || undefined}
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="Leave blank if unpaid"
                        className={fieldClasses}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment mode</label>
                    <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        disabled={!amountReceived}
                        className={`${fieldClasses} disabled:bg-slate-50 disabled:text-slate-400`}
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={fieldClasses}
                />
            </div>

            {/* Sticky on mobile so the total + submit stay reachable on a long form;
                reverts to a plain right-aligned row on larger screens. */}
            <div
                className="sticky bottom-0 -mx-4 sm:mx-0 -mb-4 sm:mb-0 px-4 sm:px-0 py-3 sm:py-0
                    border-t border-slate-100 sm:border-0 bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                    flex items-center justify-between sm:justify-end gap-3"
            >
                <span className="text-sm text-slate-500 sm:hidden">
                    Total <span className="font-semibold text-slate-800">{money(billedAmount)}</span>
                </span>
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                >
                    <span className="sm:hidden">{submitting ? "Recording…" : "Record sale"}</span>
                    <span className="hidden sm:inline">
                        {submitting ? "Recording…" : `Record sale · ${money(billedAmount)}`}
                    </span>
                </button>
            </div>
        </form>
    );
}