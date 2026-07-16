// src/components/admin/products/CategoryFieldManager.jsx
//
// Manages the dynamic field definitions on a category: add, inline edit,
// and remove. Field `key` is set once at creation and immutable after —
// the backend's updateCategoryField endpoint doesn't accept key changes,
// since renaming a key would orphan any Product.attributes already stored
// under the old one.

import { useState } from "react";
import { addCategoryField, updateCategoryField, removeCategoryField } from "../../../api/admin/categories.api";

const FIELD_TYPES = ["text", "number", "decimal", "boolean", "select", "multiselect", "date", "textarea", "url", "color"];
const NEEDS_OPTIONS = ["select", "multiselect"];
const NEEDS_RANGE = ["number", "decimal"];

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

function emptyDraft() {
    return { name: "", key: "", type: "text", required: false, options: "", min: "", max: "" };
}

function draftFromField(field) {
    return {
        name: field.name,
        key: field.key,
        type: field.type,
        required: Boolean(field.required),
        options: (field.options || []).join(", "),
        min: field.validation?.min ?? "",
        max: field.validation?.max ?? ""
    };
}

// Builds the payload shape the API expects from a draft object.
function draftToPayload(draft, { includeKey }) {
    const payload = {
        name: draft.name.trim(),
        type: draft.type,
        required: draft.required
    };
    if (includeKey) payload.key = draft.key.trim() || slugify(draft.name);

    payload.options = NEEDS_OPTIONS.includes(draft.type)
        ? draft.options.split(",").map((o) => o.trim()).filter(Boolean)
        : undefined;

    if (NEEDS_RANGE.includes(draft.type) && (draft.min !== "" || draft.max !== "")) {
        payload.validation = {
            ...(draft.min !== "" ? { min: Number(draft.min) } : {}),
            ...(draft.max !== "" ? { max: Number(draft.max) } : {})
        };
    } else {
        payload.validation = undefined;
    }

    return payload;
}

function FieldForm({ draft, setDraft, showKey, onSubmit, onCancel, submitting, submitLabel }) {
    return (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Field name</label>
                    <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                </div>
                {showKey && (
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Key <span className="text-slate-400 font-normal">(auto from name if left blank)</span>
                        </label>
                        <input
                            type="text"
                            value={draft.key}
                            onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                            placeholder={slugify(draft.name) || "field_key"}
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select
                        value={draft.type}
                        onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                        {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 mt-5">
                    <input
                        type="checkbox"
                        checked={draft.required}
                        onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
                        className="rounded border-slate-300"
                    />
                    Required
                </label>
            </div>

            {NEEDS_OPTIONS.includes(draft.type) && (
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Options <span className="text-slate-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                        type="text"
                        value={draft.options}
                        onChange={(e) => setDraft((d) => ({ ...d, options: e.target.value }))}
                        placeholder="Small, Medium, Large"
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                </div>
            )}

            {NEEDS_RANGE.includes(draft.type) && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Min (optional)</label>
                        <input
                            type="number"
                            value={draft.min}
                            onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Max (optional)</label>
                        <input
                            type="number"
                            value={draft.max}
                            onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? "Saving…" : submitLabel}
                </button>
            </div>
        </div>
    );
}

// categoryId: parent category's _id
// fields: current fields array (sorted by displayOrder by the parent)
// onFieldsChanged(nextFields): called with the server's updated fields array
export default function CategoryFieldManager({ categoryId, fields, onFieldsChanged }) {
    const [addingNew, setAddingNew] = useState(false);
    const [newDraft, setNewDraft] = useState(emptyDraft());

    const [editingKey, setEditingKey] = useState(null);
    const [editDraft, setEditDraft] = useState(emptyDraft());

    const [busyKey, setBusyKey] = useState(null); // fieldKey currently submitting/removing, or "new"
    const [error, setError] = useState(null);

    const startEdit = (field) => {
        setEditingKey(field.key);
        setEditDraft(draftFromField(field));
        setError(null);
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setError(null);
    };

    const submitNew = async () => {
        if (!newDraft.name.trim()) {
            setError("Field name is required.");
            return;
        }
        setBusyKey("new");
        setError(null);
        try {
            const updatedCategory = await addCategoryField(categoryId, draftToPayload(newDraft, { includeKey: true }));
            onFieldsChanged(updatedCategory.fields || []);
            setAddingNew(false);
            setNewDraft(emptyDraft());
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't add that field.");
        } finally {
            setBusyKey(null);
        }
    };

    const submitEdit = async (fieldKey) => {
        if (!editDraft.name.trim()) {
            setError("Field name is required.");
            return;
        }
        setBusyKey(fieldKey);
        setError(null);
        try {
            const updatedCategory = await updateCategoryField(categoryId, fieldKey, draftToPayload(editDraft, { includeKey: false }));
            onFieldsChanged(updatedCategory.fields || []);
            setEditingKey(null);
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't update that field.");
        } finally {
            setBusyKey(null);
        }
    };

    const remove = async (fieldKey) => {
        if (!window.confirm("Remove this field? Any product data stored under it will no longer show in the admin form.")) {
            return;
        }
        setBusyKey(fieldKey);
        setError(null);
        try {
            const updatedCategory = await removeCategoryField(categoryId, fieldKey);
            onFieldsChanged(updatedCategory.fields || []);
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't remove that field.");
        } finally {
            setBusyKey(null);
        }
    };

    return (
        <div className="space-y-3">
            {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
            )}

            {fields.length === 0 && !addingNew && (
                <p className="text-xs text-slate-400">No custom fields yet for this category.</p>
            )}

            <div className="space-y-2">
                {fields.map((field) =>
                    editingKey === field.key ? (
                        <FieldForm
                            key={field.key}
                            draft={editDraft}
                            setDraft={setEditDraft}
                            showKey={false}
                            onSubmit={() => submitEdit(field.key)}
                            onCancel={cancelEdit}
                            submitting={busyKey === field.key}
                            submitLabel="Save field"
                        />
                    ) : (
                        <div key={field.key} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                    {field.name}
                                    {field.required && <span className="text-red-500"> *</span>}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {field.type}
                                    {field.key ? ` · ${field.key}` : ""}
                                    {field.options?.length ? ` · ${field.options.join(", ")}` : ""}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 pl-3">
                                <button type="button" onClick={() => startEdit(field)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(field.key)}
                                    disabled={busyKey === field.key}
                                    className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                                >
                                    {busyKey === field.key ? "…" : "Remove"}
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>

            {addingNew ? (
                <FieldForm
                    draft={newDraft}
                    setDraft={setNewDraft}
                    showKey={true}
                    onSubmit={submitNew}
                    onCancel={() => {
                        setAddingNew(false);
                        setNewDraft(emptyDraft());
                        setError(null);
                    }}
                    submitting={busyKey === "new"}
                    submitLabel="Add field"
                />
            ) : (
                <button type="button" onClick={() => setAddingNew(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    + Add field
                </button>
            )}
        </div>
    );
}