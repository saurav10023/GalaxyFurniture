// src/components/admin/products/CategoryEditModal.jsx
//
// `category` is the full doc already held by CategoryManagementBoard —
// the admin categories list isn't sanitized, so it already includes
// `fields`, `isActive`, etc. No extra fetch needed on open, unlike
// ProductEditModal (which has to hit a separate admin-only endpoint
// because the product list/sanitizeProduct util strips things down).

import { useState } from "react";
import { updateCategory, activateCategory, deactivateCategory, deleteCategory } from "../../../api/admin/categories.api";
import CategoryFieldManager from "./CategoryFieldManager";

const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function CategoryEditModal({ category, onClose, onUpdated, onDeleted }) {
    const [name, setName] = useState(category.name || "");
    const [description, setDescription] = useState(category.description || "");
    const [isFeatured, setIsFeatured] = useState(Boolean(category.isFeatured));
    const [isActive, setIsActive] = useState(Boolean(category.isActive));
    const [fields, setFields] = useState((category.fields || []).slice().sort((a, b) => a.displayOrder - b.displayOrder));

    const [savingDetails, setSavingDetails] = useState(false);
    const [togglingActive, setTogglingActive] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);

    const saveDetails = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Category name is required.");
            return;
        }
        setSavingDetails(true);
        setError(null);
        try {
            const updated = await updateCategory(category._id, {
                name: name.trim(),
                description: description.trim() || undefined,
                isFeatured
            });
            onUpdated?.(updated);
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't save changes.");
        } finally {
            setSavingDetails(false);
        }
    };

    const toggleActive = async () => {
        setTogglingActive(true);
        setError(null);
        try {
            const updated = isActive ? await deactivateCategory(category._id) : await activateCategory(category._id);
            setIsActive(Boolean(updated.isActive));
            onUpdated?.(updated);
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't change category status.");
        } finally {
            setTogglingActive(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${category.name}"? This can't be undone.`)) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteCategory(category._id);
            onDeleted?.(category._id);
        } catch (err) {
            // Backend returns 409 with the referencing product count if any
            // products still point at this category — surface it as-is so
            // the admin knows to deactivate instead of forcing a delete.
            setError(err?.response?.data?.message || "Couldn't delete this category.");
            setDeleting(false);
        }
    };

    const busy = savingDetails || togglingActive || deleting;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />

            <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-xl sm:rounded-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-slate-900">Edit category</h2>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    isActive ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                            />
                            {isActive ? "Active" : "Deactivated"} · visible to customers only when active
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                        aria-label="Close"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                    )}

                    <form onSubmit={saveDetails} className="space-y-4">
                        <div>
                            <label className={labelClass}>Category name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 transition hover:border-slate-300">
                            <span className="text-sm text-slate-700">
                                Show in <span className="font-medium">"Featured Categories"</span>
                            </span>
                            <span className="relative inline-flex shrink-0 items-center">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />
                                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                            </span>
                        </label>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {savingDetails ? "Saving…" : "Save details"}
                            </button>
                        </div>
                    </form>

                    <fieldset className="rounded-xl border border-slate-200 p-4">
                        <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                    <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </span>
                            Custom fields
                        </legend>
                        <div className="mt-3">
                            <CategoryFieldManager categoryId={category._id} fields={fields} onFieldsChanged={setFields} />
                        </div>
                    </fieldset>

                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={toggleActive}
                            disabled={busy}
                            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                        >
                            {togglingActive ? "…" : isActive ? "Deactivate category" : "Activate category"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={busy}
                            className="rounded-full px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                        >
                            {deleting ? "Deleting…" : "Delete category"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}