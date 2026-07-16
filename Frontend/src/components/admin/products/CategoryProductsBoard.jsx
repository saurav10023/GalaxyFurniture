// src/components/admin/products/CategoryProductsBoard.jsx
//
// Joins getAllProducts (unpopulated category refs) with getAllCategories
// (id -> name) in memory, since the current backend doesn't populate or
// group products by category. See note in the chat this file came from
// if you want to swap this for a dedicated grouped/search endpoint later.

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllProducts, toggleProductStatus, deleteProduct } from "../../../api/admin/products.api";
import { getAllCategories } from "../../../api/admin/categories.api";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 200; // see note above on why this isn't real pagination yet

// refreshKey: bump this from the parent (e.g. after a product/category is
// created) to force a refetch without prop-drilling a setState down.
export default function CategoryProductsBoard({ refreshKey, onEditProduct }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [productRes, categoryList] = await Promise.all([
                getAllProducts({ limit: PAGE_SIZE, page: 1 }),
                getAllCategories({ includeInactive: true })
            ]);
            setProducts(productRes.products);
            setCategories(categoryList);
        } catch (err) {
            setError("Couldn't load products. Please refresh.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    const handleToggleStatus = async (product) => {
        const previous = products;
        setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isActive: !p.isActive } : p)));
        try {
            await toggleProductStatus(product._id);
        } catch (err) {
            setProducts(previous); // revert on failure
            setError(`Couldn't update "${product.name}". Please try again.`);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
        const previous = products;
        setProducts((prev) => prev.filter((p) => p._id !== product._id));
        try {
            await deleteProduct(product._id);
        } catch (err) {
            setProducts(previous);
            setError(`Couldn't delete "${product.name}". Please try again.`);
        }
    };

    // Group products by category id, then apply the search filter on top.
    const { sections, totalVisible } = useMemo(() => {
        const grouped = new Map();
        for (const product of products) {
            const catId = typeof product.category === "string" ? product.category : product.category?._id;
            if (!grouped.has(catId)) grouped.set(catId, []);
            grouped.get(catId).push(product);
        }

        const q = query.trim().toLowerCase();

        const built = categories
            .map((cat) => {
                const items = (grouped.get(cat._id) || []).filter((p) =>
                    q ? p.name?.toLowerCase().includes(q) : true
                );
                return { category: cat, items };
            })
            .filter((section) => section.items.length > 0)
            .filter((section) => activeCategoryFilter === "all" || section.category._id === activeCategoryFilter);

        const total = built.reduce((sum, s) => sum + s.items.length, 0);
        return { sections: built, totalVisible: total };
    }, [products, categories, activeCategoryFilter, query]);

    const categoryCounts = useMemo(() => {
        const counts = new Map();
        for (const product of products) {
            const catId = typeof product.category === "string" ? product.category : product.category?._id;
            counts.set(catId, (counts.get(catId) || 0) + 1);
        }
        return counts;
    }, [products]);

    if (error) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-red-600">
                        <path
                            d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.39-2.06L13.71 3.86a1.5 1.5 0 00-2.42 0z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                    onClick={load}
                    className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 active:scale-[0.97]"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur-sm sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Products by category</h2>
                        {!loading && (
                            <p className="text-xs text-slate-400">
                                {totalVisible} product{totalVisible === 1 ? "" : "s"} shown
                            </p>
                        )}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        >
                            <path
                                d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products…"
                            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                {/* Category pills — horizontally scrollable on small screens */}
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                        onClick={() => setActiveCategoryFilter("all")}
                        className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                            activeCategoryFilter === "all"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        All ({products.length})
                    </button>
                    {categories.map((c) => {
                        const count = categoryCounts.get(c._id) || 0;
                        if (count === 0) return null;
                        const active = activeCategoryFilter === c._id;
                        return (
                            <button
                                key={c._id}
                                onClick={() => setActiveCategoryFilter(c._id)}
                                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                                    active
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                } ${!c.isActive ? "opacity-60" : ""}`}
                            >
                                {c.name} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <SkeletonBoard />
            ) : sections.length === 0 ? (
                <EmptyState hasQuery={query.trim().length > 0} />
            ) : (
                sections.map(({ category, items }) => (
                    <section key={category._id}>
                        <div className="mb-3 flex items-baseline gap-2">
                            <h3 className="text-sm font-semibold text-slate-700">{category.name}</h3>
                            <span className="text-xs text-slate-400">
                                {items.length} product{items.length === 1 ? "" : "s"}
                            </span>
                            {!category.isActive && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    Category inactive
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {items.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onToggleStatus={handleToggleStatus}
                                    onDelete={handleDelete}
                                    onEdit={onEditProduct}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}

function SkeletonBoard() {
    return (
        <div className="space-y-8 animate-pulse">
            {[0, 1].map((section) => (
                <div key={section}>
                    <div className="mb-3 h-4 w-32 rounded bg-slate-200" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2 rounded-xl border border-slate-100 p-2">
                                <div className="aspect-square w-full rounded-lg bg-slate-200" />
                                <div className="h-3 w-4/5 rounded bg-slate-200" />
                                <div className="h-3 w-1/2 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ hasQuery }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-slate-400">
                    <path
                        d="M3 7l1.4-2.8A2 2 0 016.2 3h11.6a2 2 0 011.8 1.2L21 7M3 7h18M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M9 11a3 3 0 006 0"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">
                {hasQuery ? "No products match your search" : "No products yet"}
            </p>
            <p className="text-xs text-slate-400">
                {hasQuery ? "Try a different name or clear the search." : "Products you add will show up here, grouped by category."}
            </p>
        </div>
    );
}