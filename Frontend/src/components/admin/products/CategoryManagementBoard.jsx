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
                <div key={i} className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3.5">
                    <div className="space-y-2">
                        <div className="h-3.5 w-32 rounded-full bg-linen" />
                        <div className="h-3 w-48 rounded-full bg-linen/70" />
                    </div>
                    <div className="h-3 w-10 rounded-full bg-linen/70" />
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
            <div className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-6 text-center text-sm text-red-700">
                {error}
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-line bg-linen/40 px-4 py-10 text-center">
                <p className="text-sm font-medium text-ink">No categories yet</p>
                <p className="mt-1 text-xs text-stone">Create one using the form to start organizing products.</p>
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
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 transition hover:border-clay/50 hover:shadow-[0_8px_24px_-16px_rgba(42,37,31,0.3)]"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate font-display text-lg font-semibold text-ink">{category.name}</p>
                                {category.isFeatured && (
                                    <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-medium text-clay-deep">
                                        Featured
                                    </span>
                                )}
                                {!category.isActive && (
                                    <span className="rounded-full bg-linen px-2 py-0.5 text-[10px] font-medium text-stone">
                                        Deactivated
                                    </span>
                                )}
                            </div>
                            {category.description && (
                                <p className="mt-0.5 truncate text-xs text-stone">{category.description}</p>
                            )}
                            <p className="mt-1 flex items-center gap-1 text-xs text-stone">
                                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-clay">
                                    <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                {fieldCount} custom field{fieldCount === 1 ? "" : "s"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onEditCategory(category)}
                            className="shrink-0 rounded-full bg-moss/10 px-3.5 py-1.5 text-xs font-medium text-moss transition hover:bg-moss/15"
                        >
                            Edit
                        </button>
                    </div>
                );
            })}
        </div>
    );
}