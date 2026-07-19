// src/components/admin/products/CategoryFieldBuilder.jsx
//
// Controlled component: parent (CategoryCreateForm) owns the `fields` array
// in state and passes it down along with onChange. This component just
// renders the editor UI and reports back a new fields array on every edit.
//
// Field shape mirrors category.model.js's fieldSchema exactly:
// { name, key, type, required, options, validation: { min, max, minLength, maxLength, pattern }, displayOrder }

import { useState } from "react";

const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long text" },
    { value: "number", label: "Number (integer)" },
    { value: "decimal", label: "Number (decimal)" },
    { value: "boolean", label: "Yes / No" },
    { value: "select", label: "Single choice" },
    { value: "multiselect", label: "Multiple choice" },
    { value: "date", label: "Date" },
    { value: "url", label: "URL" },
    { value: "color", label: "Color" }
];

const NEEDS_OPTIONS = ["select", "multiselect"];
const HAS_LENGTH_VALIDATION = ["text", "textarea", "url"];
const HAS_RANGE_VALIDATION = ["number", "decimal"];

const slugifyKey = (name) =>
    name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/(^_|_$)/g, "");

const emptyField = () => ({
    name: "",
    key: "",
    type: "text",
    required: false,
    options: [],
    validation: {},
    displayOrder: 0,
    _keyEditedManually: false
});

const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

export default function CategoryFieldBuilder({ fields, onChange }) {
    const [optionsDraft, setOptionsDraft] = useState({}); // per-field raw options text while typing

    const updateField = (index, patch) => {
        const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
        onChange(next);
    };

    const updateValidation = (index, patch) => {
        const next = fields.map((f, i) =>
            i === index ? { ...f, validation: { ...f.validation, ...patch } } : f
        );
        onChange(next);
    };

    const addField = () => {
        onChange([...fields, { ...emptyField(), displayOrder: fields.length }]);
    };

    const removeField = (index) => {
        const next = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, displayOrder: i }));
        onChange(next);
    };

    const moveField = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= fields.length) return;
        const next = [...fields];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next.map((f, i) => ({ ...f, displayOrder: i })));
    };

    const handleNameChange = (index, name) => {
        const field = fields[index];
        const patch = { name };
        if (!field._keyEditedManually) {
            patch.key = slugifyKey(name);
        }
        updateField(index, patch);
    };

    const handleKeyChange = (index, rawKey) => {
        updateField(index, { key: slugifyKey(rawKey), _keyEditedManually: true });
    };

    const handleOptionsChange = (index, rawText) => {
        setOptionsDraft((prev) => ({ ...prev, [index]: rawText }));
        const options = rawText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        updateField(index, { options });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-medium text-slate-700">Custom fields for this category</h3>
                    <p className="text-xs text-slate-400">Shown on every product created under this category.</p>
                </div>
                <button
                    type="button"
                    onClick={addField}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add field
                </button>
            </div>

            {fields.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
                    <p className="text-sm text-slate-400">
                        No custom fields yet. Products in this category will only have the standard fields
                        (material, color, dimensions, etc).
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {fields.map((field, index) => {
                    const keyDuplicate =
                        field.key && fields.filter((f) => f.key === field.key).length > 1;

                    return (
                        <div
                            key={index}
                            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4"
                        >
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Field label
                                        </label>
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => handleNameChange(index, e.target.value)}
                                            placeholder="e.g. Seating Capacity"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Key (stored on product)
                                        </label>
                                        <input
                                            type="text"
                                            value={field.key}
                                            onChange={(e) => handleKeyChange(index, e.target.value)}
                                            placeholder="seating_capacity"
                                            className={`${inputClass} font-mono ${
                                                keyDuplicate ? "border-red-400 focus:border-red-400 focus:ring-red-50" : ""
                                            }`}
                                        />
                                        {keyDuplicate && (
                                            <p className="mt-1 text-xs text-red-500">
                                                Duplicate key — each field needs a unique key.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-col items-center gap-0.5 pt-5">
                                    <button
                                        type="button"
                                        onClick={() => moveField(index, -1)}
                                        disabled={index === 0}
                                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:opacity-25 disabled:hover:bg-transparent"
                                        aria-label="Move field up"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveField(index, 1)}
                                        disabled={index === fields.length - 1}
                                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:opacity-25 disabled:hover:bg-transparent"
                                        aria-label="Move field down"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeField(index)}
                                    className="shrink-0 self-start pt-5 text-xs font-medium text-red-500 transition hover:text-red-600"
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">
                                        Field type
                                    </label>
                                    <select
                                        value={field.type}
                                        onChange={(e) => updateField(index, { type: e.target.value, options: [] })}
                                        className={inputClass}
                                    >
                                        {FIELD_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 self-end pb-1.5 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateField(index, { required: e.target.checked })}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Required
                                </label>
                            </div>

                            {NEEDS_OPTIONS.includes(field.type) && (
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">
                                        Options (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={optionsDraft[index] ?? field.options.join(", ")}
                                        onChange={(e) => handleOptionsChange(index, e.target.value)}
                                        placeholder="Small, Medium, Large"
                                        className={inputClass}
                                    />
                                    {field.options.length === 0 ? (
                                        <p className="mt-1 text-xs text-amber-600">
                                            At least one option is required for this field type.
                                        </p>
                                    ) : (
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {field.options.map((opt) => (
                                                <span
                                                    key={opt}
                                                    className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
                                                >
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {HAS_RANGE_VALIDATION.includes(field.type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Min value
                                        </label>
                                        <input
                                            type="number"
                                            value={field.validation?.min ?? ""}
                                            onChange={(e) =>
                                                updateValidation(index, {
                                                    min: e.target.value === "" ? undefined : Number(e.target.value)
                                                })
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Max value
                                        </label>
                                        <input
                                            type="number"
                                            value={field.validation?.max ?? ""}
                                            onChange={(e) =>
                                                updateValidation(index, {
                                                    max: e.target.value === "" ? undefined : Number(e.target.value)
                                                })
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}

                            {HAS_LENGTH_VALIDATION.includes(field.type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Min length
                                        </label>
                                        <input
                                            type="number"
                                            value={field.validation?.minLength ?? ""}
                                            onChange={(e) =>
                                                updateValidation(index, {
                                                    minLength:
                                                        e.target.value === "" ? undefined : Number(e.target.value)
                                                })
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Max length
                                        </label>
                                        <input
                                            type="number"
                                            value={field.validation?.maxLength ?? ""}
                                            onChange={(e) =>
                                                updateValidation(index, {
                                                    maxLength:
                                                        e.target.value === "" ? undefined : Number(e.target.value)
                                                })
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}