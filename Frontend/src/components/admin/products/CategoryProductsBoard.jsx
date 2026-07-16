// src/components/admin/products/CategoryProductsBoard.jsx
//
// Joins getAllProducts (unpopulated category refs) with getAllCategories
// (id -> name) in memory, since the current backend doesn't populate or
// group products by category. See note in the chat this file came from
// if you want to swap this for a dedicated grouped/search endpoint later.

import { useCallback, useEffect, useState } from "react";
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

    if (loading) {
        return <p className="text-sm text-slate-400 py-8 text-center">Loading products…</p>;
    }

    if (error) {
        return (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
            </div>
        );
    }

    // Group products by category id
    const grouped = new Map();
    for (const product of products) {
        const catId = typeof product.category === "string" ? product.category : product.category?._id;
        if (!grouped.has(catId)) grouped.set(catId, []);
        grouped.get(catId).push(product);
    }

    const sections = categories
        .map((cat) => ({ category: cat, items: grouped.get(cat._id) || [] }))
        .filter((section) => section.items.length > 0)
        .filter((section) => activeCategoryFilter === "all" || section.category._id === activeCategoryFilter);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Products by category</h2>
                <select
                    value={activeCategoryFilter}
                    onChange={(e) => setActiveCategoryFilter(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {sections.length === 0 && (
                <p className="text-sm text-slate-400 py-8 text-center">No products yet.</p>
            )}

            {sections.map(({ category, items }) => (
                <section key={category._id}>
                    <div className="flex items-baseline gap-2 mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">{category.name}</h3>
                        <span className="text-xs text-slate-400">{items.length} product{items.length === 1 ? "" : "s"}</span>
                        {!category.isActive && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                                Category inactive
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
            ))}
        </div>
    );
}