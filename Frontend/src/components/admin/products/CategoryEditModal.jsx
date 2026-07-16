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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Edit category</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isActive ? "Active" : "Deactivated"} · visible to customers only when active
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="text-slate-400 hover:text-slate-600 text-xl leading-none disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
                    )}

                    <form onSubmit={saveDetails} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            Featured category
                        </label>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={busy}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {savingDetails ? "Saving…" : "Save details"}
                            </button>
                        </div>
                    </form>

                    <fieldset className="rounded-lg border border-slate-200 p-4">
                        <legend className="px-1 text-sm font-medium text-slate-700">Custom fields</legend>
                        <CategoryFieldManager categoryId={category._id} fields={fields} onFieldsChanged={setFields} />
                    </fieldset>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={toggleActive}
                            disabled={busy}
                            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                            {togglingActive ? "…" : isActive ? "Deactivate category" : "Activate category"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={busy}
                            className="rounded-md px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
                        >
                            {deleting ? "Deleting…" : "Delete category"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}