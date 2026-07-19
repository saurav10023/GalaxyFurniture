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

const TYPE_LABELS = {
    text: "Text",
    number: "Number",
    decimal: "Decimal",
    boolean: "Yes / No",
    select: "Single choice",
    multiselect: "Multiple choice",
    date: "Date",
    textarea: "Long text",
    url: "URL",
    color: "Color"
};

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

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
        <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Field name</label>
                    <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        className={inputClass}
                        autoFocus
                    />
                </div>
                {showKey && (
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            Key <span className="font-normal text-slate-400">(auto from name if left blank)</span>
                        </label>
                        <input
                            type="text"
                            value={draft.key}
                            onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                            placeholder={slugify(draft.name) || "field_key"}
                            className={`${inputClass} font-mono`}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
                    <select
                        value={draft.type}
                        onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                        className={inputClass}
                    >
                        {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </div>
                <label className="flex items-center gap-2 self-end pb-1.5 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={draft.required}
                        onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Required
                </label>
            </div>

            {NEEDS_OPTIONS.includes(draft.type) && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                        Options <span className="font-normal text-slate-400">(comma-separated)</span>
                    </label>
                    <input
                        type="text"
                        value={draft.options}
                        onChange={(e) => setDraft((d) => ({ ...d, options: e.target.value }))}
                        placeholder="Small, Medium, Large"
                        className={inputClass}
                    />
                </div>
            )}

            {NEEDS_RANGE.includes(draft.type) && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Min (optional)</label>
                        <input
                            type="number"
                            value={draft.min}
                            onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Max (optional)</label>
                        <input
                            type="number"
                            value={draft.max}
                            onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
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
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}

            {fields.length === 0 && !addingNew && (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-xs text-slate-400">
                    No custom fields yet for this category.
                </p>
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
                        <div
                            key={field.key}
                            className="flex flex-col gap-2 rounded-md border border-slate-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-700">
                                    {field.name}
                                    {field.required && <span className="text-red-500"> *</span>}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                        {TYPE_LABELS[field.type] || field.type}
                                    </span>
                                    {field.key && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">
                                            {field.key}
                                        </span>
                                    )}
                                    {field.options?.length > 0 && (
                                        <span className="truncate text-[11px] text-slate-400">
                                            {field.options.join(", ")}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 pl-0 sm:pl-3">
                                <button
                                    type="button"
                                    onClick={() => startEdit(field)}
                                    className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(field.key)}
                                    disabled={busyKey === field.key}
                                    className="text-xs font-medium text-red-500 transition hover:text-red-600 disabled:opacity-50"
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
                <button
                    type="button"
                    onClick={() => setAddingNew(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add field
                </button>
            )}
        </div>
    );
}