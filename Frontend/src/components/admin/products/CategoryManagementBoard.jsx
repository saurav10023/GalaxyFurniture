// src/components/admin/products/CategoryManagementBoard.jsx
//
// Lists every category for the admin (including deactivated ones) so
// they can be edited, (de)activated, or deleted. Separate from
// CategoryProductsBoard, which lists products *within* a category.

import { useEffect, useState } from "react";
import { getAllCategories } from "../../../api/admin/categories.api";

export default function CategoryManagementBoard({ refreshKey, onEditCategory }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getAllCategories({ includeInactive: true });
                if (!cancelled) setCategories(data || []);
            } catch (err) {
                if (!cancelled) setError(err?.response?.data?.message || "Couldn't load categories.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    if (loading) return <p className="text-sm text-slate-400 py-6 text-center">Loading categories…</p>;
    if (error) return <p className="text-sm text-red-600 py-6 text-center">{error}</p>;
    if (categories.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">No categories yet.</p>;

    return (
        <div className="space-y-2">
            {categories.map((category) => (
                <div key={category._id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 truncate">{category.name}</p>
                            {category.isFeatured && (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                                    Featured
                                </span>
                            )}
                            {!category.isActive && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                    Deactivated
                                </span>
                            )}
                        </div>
                        {category.description && <p className="text-xs text-slate-400 truncate">{category.description}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">
                            {(category.fields || []).length} custom field{(category.fields || []).length === 1 ? "" : "s"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onEditCategory(category)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 shrink-0 ml-3"
                    >
                        Edit
                    </button>
                </div>
            ))}
        </div>
    );
}