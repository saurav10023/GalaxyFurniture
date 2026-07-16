// src/components/admin/products/CategoryCreateForm.jsx
import { useState } from "react";
import CategoryFieldBuilder from "./CategoryFieldBuilder";
import { createCategory } from "../../../api/admin/categories.api";

const emptyForm = {
    name: "",
    description: "",
    isFeatured: false
};

const DESCRIPTION_LIMIT = 240;

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
        <form
            onSubmit={handleSubmit}
            className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-indigo-600">
                        <path
                            d="M4 6h16M4 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">New category</h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Categories group products and can define their own custom fields.
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-red-500">
                        <path
                            d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.39-2.06L13.71 3.86a1.5 1.5 0 00-2.42 0z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-5">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Category name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="e.g. Sofas"
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        required
                    />
                </div>

                <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <span className="text-xs text-slate-400">
                            {form.description.length}/{DESCRIPTION_LIMIT}
                        </span>
                    </div>
                    <textarea
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value.slice(0, DESCRIPTION_LIMIT))}
                        rows={3}
                        placeholder="A short blurb shown wherever this category appears."
                        className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <span className="text-sm text-slate-700">
                        Show in <span className="font-medium">"Featured Categories"</span> on the homepage
                    </span>
                    <span className="relative inline-flex shrink-0 items-center">
                        <input
                            type="checkbox"
                            checked={form.isFeatured}
                            onChange={(e) => handleChange("isFeatured", e.target.checked)}
                            className="peer sr-only"
                        />
                        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />
                        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                    </span>
                </label>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <CategoryFieldBuilder fields={fields} onChange={setFields} />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting && (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-90" />
                        </svg>
                    )}
                    {submitting ? "Creating…" : "Create category"}
                </button>
            </div>
        </form>
    );
}