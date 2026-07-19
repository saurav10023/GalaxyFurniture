// src/components/admin/products/CategorySelect.jsx
//
// Fetches active categories once and renders a <select>. Category docs
// already include their `fields` array (Category.find returns full docs),
// so the parent gets everything it needs from onChange without a second
// request — no need to call getCategory(id) separately.

import { useEffect, useState } from "react";
import { getAllCategories } from "../../../api/admin/categories.api";

// value: currently selected category id (or "")
// onChange: (categoryId, categoryDoc | null) => void
// includeInactive: pass true if this select should also list deactivated
//   categories (e.g. an admin filter view) — defaults to active-only,
//   which is what a product-creation form should use.
export default function CategorySelect({ value, onChange, includeInactive = false, label = "Category" }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const list = await getAllCategories({ includeInactive });
                if (!cancelled) setCategories(list);
            } catch (err) {
                if (!cancelled) setError("Couldn't load categories.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [includeInactive]);

    const handleChange = (e) => {
        const id = e.target.value;
        const doc = categories.find((c) => c._id === id) || null;
        onChange(id, doc);
    };

    return (
        <div>
            {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
            <div className="relative">
                <select
                    value={value || ""}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <option value="" disabled>
                        {loading ? "Loading categories…" : "Select a category"}
                    </option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            {!loading && categories.length === 0 && !error && (
                <p className="mt-1 text-xs text-slate-400">No categories yet — create one first.</p>
            )}
        </div>
    );
}