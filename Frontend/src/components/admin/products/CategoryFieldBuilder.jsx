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
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Custom fields for this category</h3>
                <button
                    type="button"
                    onClick={addField}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    + Add field
                </button>
            </div>

            {fields.length === 0 && (
                <p className="text-sm text-slate-400 italic">
                    No custom fields yet. Products in this category will only have the standard fields
                    (material, color, dimensions, etc).
                </p>
            )}

            <div className="space-y-3">
                {fields.map((field, index) => {
                    const keyDuplicate =
                        field.key && fields.filter((f) => f.key === field.key).length > 1;

                    return (
                        <div
                            key={index}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Field label
                                        </label>
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => handleNameChange(index, e.target.value)}
                                            placeholder="e.g. Seating Capacity"
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Key (stored on product)
                                        </label>
                                        <input
                                            type="text"
                                            value={field.key}
                                            onChange={(e) => handleKeyChange(index, e.target.value)}
                                            placeholder="seating_capacity"
                                            className={`w-full rounded-md border px-3 py-1.5 text-sm font-mono ${
                                                keyDuplicate ? "border-red-400" : "border-slate-300"
                                            }`}
                                        />
                                        {keyDuplicate && (
                                            <p className="text-xs text-red-500 mt-1">
                                                Duplicate key — each field needs a unique key.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 pt-5">
                                    <button
                                        type="button"
                                        onClick={() => moveField(index, -1)}
                                        disabled={index === 0}
                                        className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                        aria-label="Move field up"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveField(index, 1)}
                                        disabled={index === fields.length - 1}
                                        className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                        aria-label="Move field down"
                                    >
                                        ▼
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeField(index)}
                                    className="pt-5 text-sm text-red-500 hover:text-red-600"
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Field type
                                    </label>
                                    <select
                                        value={field.type}
                                        onChange={(e) => updateField(index, { type: e.target.value, options: [] })}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    >
                                        {FIELD_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end pb-1.5">
                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => updateField(index, { required: e.target.checked })}
                                            className="rounded border-slate-300"
                                        />
                                        Required
                                    </label>
                                </div>
                            </div>

                            {NEEDS_OPTIONS.includes(field.type) && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Options (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={optionsDraft[index] ?? field.options.join(", ")}
                                        onChange={(e) => handleOptionsChange(index, e.target.value)}
                                        placeholder="Small, Medium, Large"
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                    {field.options.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            At least one option is required for this field type.
                                        </p>
                                    )}
                                </div>
                            )}

                            {HAS_RANGE_VALIDATION.includes(field.type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
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
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
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
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {HAS_LENGTH_VALIDATION.includes(field.type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
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
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
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
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
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