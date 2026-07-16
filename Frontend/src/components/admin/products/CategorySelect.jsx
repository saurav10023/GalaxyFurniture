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
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <select
                value={value || ""}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {!loading && categories.length === 0 && !error && (
                <p className="text-xs text-slate-400 mt-1">
                    No categories yet — create one first.
                </p>
            )}
        </div>
    );
}