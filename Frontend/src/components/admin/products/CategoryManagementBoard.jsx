// src/components/admin/products/CategoryManagementBoard.jsx
//
// Lists every category for the admin (including deactivated ones) so
// they can be edited, (de)activated, or deleted. Separate from
// CategoryProductsBoard, which lists products *within* a category.

import { useEffect, useState } from "react";
import { getAllCategories } from "../../../api/admin/categories.api";

function CategorySkeleton() {
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3.5">
                    <div className="space-y-2">
                        <div className="h-3.5 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-48 rounded bg-slate-100" />
                    </div>
                    <div className="h-3 w-10 rounded bg-slate-100" />
                </div>
            ))}
        </div>
    );
}

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

    if (loading) return <CategorySkeleton />;

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-6 text-center text-sm text-red-700">
                {error}
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-600">No categories yet</p>
                <p className="mt-1 text-xs text-slate-400">Create one using the form to start organizing products.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {categories.map((category) => {
                const fieldCount = (category.fields || []).length;
                return (
                    <div
                        key={category._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-slate-300 hover:shadow-sm"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
                                {category.isFeatured && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                        Featured
                                    </span>
                                )}
                                {!category.isActive && (
                                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                        Deactivated
                                    </span>
                                )}
                            </div>
                            {category.description && (
                                <p className="mt-0.5 truncate text-xs text-slate-400">{category.description}</p>
                            )}
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                                    <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                {fieldCount} custom field{fieldCount === 1 ? "" : "s"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onEditCategory(category)}
                            className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                        >
                            Edit
                        </button>
                    </div>
                );
            })}
        </div>
    );
}