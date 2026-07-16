// src/components/admin/products/CategoryCreateForm.jsx
import { useState } from "react";
import CategoryFieldBuilder from "./CategoryFieldBuilder";
import { createCategory } from "../../../api/admin/categories.api";

const emptyForm = {
    name: "",
    description: "",
    isFeatured: false
};

// onCreated: called with the created category doc — parent (ProductManagement)
// should use this to refresh CategorySelect's list and/or CategoryProductsBoard.
export default function CategoryCreateForm({ onCreated }) {
    const [form, setForm] = useState(emptyForm);
    const [fields, setFields] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const validate = () => {
        if (!form.name.trim()) return "Category name is required.";

        const keys = fields.map((f) => f.key);
        if (new Set(keys).size !== keys.length) return "Field keys must be unique.";

        for (const f of fields) {
            if (!f.name.trim() || !f.key.trim()) return "Every field needs a label and a key.";
            if (["select", "multiselect"].includes(f.type) && f.options.length === 0) {
                return `Field "${f.name}" needs at least one option.`;
            }
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
            // Strip the internal _keyEditedManually flag before sending
            const cleanFields = fields.map(({ _keyEditedManually, ...rest }) => rest);

            const category = await createCategory({
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                isFeatured: form.isFeatured,
                fields: cleanFields
            });

            setForm(emptyForm);
            setFields([]);
            onCreated?.(category);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create category. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">New category</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    Categories group products and can define their own custom fields.
                </p>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category name</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Sofas"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => handleChange("isFeatured", e.target.checked)}
                    className="rounded border-slate-300"
                />
                Show in "Featured Categories" on the homepage
            </label>

            <div className="border-t border-slate-100 pt-4">
                <CategoryFieldBuilder fields={fields} onChange={setFields} />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? "Creating…" : "Create category"}
                </button>
            </div>
        </form>
    );
}