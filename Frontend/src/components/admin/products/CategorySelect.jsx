// src/components/admin/products/CategorySelect.jsx
//
// Fetches active categories once and renders the themed Select. Category docs
// already include their `fields` array (Category.find returns full docs),
// so the parent gets everything it needs from onChange without a second
// request — no need to call getCategory(id) separately.

import { useEffect, useMemo, useState } from "react";
import { getAllCategories } from "../../../api/admin/categories.api";
import Select from "../../ui/Select";

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

    const options = useMemo(
        () => categories.map((cat) => ({ value: cat._id, label: cat.name })),
        [categories]
    );

    const handleChange = (id) => {
        const doc = categories.find((c) => c._id === id) || null;
        onChange(id, doc);
    };

    return (
        <div>
            {label && <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}
            <Select
                value={value || ""}
                onChange={handleChange}
                options={options}
                placeholder={loading ? "Loading categories…" : "Select a category"}
                disabled={loading}
                fullWidth
            />
            {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
            {!loading && categories.length === 0 && !error && (
                <p className="mt-1 text-xs text-stone">No categories yet — create one first.</p>
            )}
        </div>
    );
}