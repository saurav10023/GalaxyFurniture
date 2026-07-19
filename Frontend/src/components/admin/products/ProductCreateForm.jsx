// src/components/admin/products/ProductCreateForm.jsx
import { useState } from "react";
import CategorySelect from "./CategorySelect";
import { createProduct, setInitialStock } from "../../../api/admin/products.api";

const MAX_IMAGES = 5;

const initialForm = {
    name: "",
    brand: "",
    description: "",
    material: "",
    color: "",
    supplier: "",
    outOfStockAction: "show_as_out_of_stock",
    isFeatured: false,
    isNewArrival: false,
    dimensions: { length: "", width: "", height: "", unit: "cm" },
    pricing: {
        purchasePrice: "",
        sellingPrice: "",
        displayMode: "show_price",
        negotiation: { enabled: false, minimumPrice: "" }
    },
    initialStock: "" // client-only convenience field, see handleSubmit
};

const inputClass =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
const smallInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const smallLabelClass = "mb-1 block text-xs font-medium text-slate-500";

function Toggle({ checked, onChange }) {
    return (
        <span className="relative inline-flex shrink-0 items-center">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
            <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
        </span>
    );
}

function SectionIcon({ children }) {
    return (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
            {children}
        </span>
    );
}

function Section({ icon, title, children }) {
    return (
        <fieldset className="rounded-xl border border-slate-200 p-4 sm:p-5">
            <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-700">
                <SectionIcon>{icon}</SectionIcon>
                {title}
            </legend>
            <div className="mt-3 space-y-4">{children}</div>
        </fieldset>
    );
}

// Renders one input, matched to the field's type, for a category's
// custom attributes — mirrors the type switch in
// validateAttributesAgainstCategory() on the backend.
function AttributeInput({ field, value, onChange }) {
    switch (field.type) {
        case "textarea":
            return (
                <textarea
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    rows={2}
                    className={smallInputClass}
                />
            );
        case "number":
        case "decimal":
            return (
                <input
                    type="number"
                    step={field.type === "decimal" ? "0.01" : "1"}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    min={field.validation?.min}
                    max={field.validation?.max}
                    className={smallInputClass}
                />
            );
        case "boolean":
            return (
                <label className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Toggle checked={Boolean(value)} onChange={onChange} />
                    Yes
                </label>
            );
        case "date":
            return <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={smallInputClass} />;
        case "url":
            return <input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={smallInputClass} />;
        case "color":
            return (
                <input
                    type="color"
                    value={value || "#000000"}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300"
                />
            );
        case "select":
            return (
                <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={smallInputClass}>
                    <option value="" disabled>
                        Select…
                    </option>
                    {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        case "multiselect": {
            const selected = Array.isArray(value) ? value : [];
            const toggle = (opt) =>
                onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
            return (
                <div className="flex flex-wrap gap-2">
                    {(field.options || []).map((opt) => (
                        <button
                            type="button"
                            key={opt}
                            onClick={() => toggle(opt)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                selected.includes(opt)
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            );
        }
        case "text":
        default:
            return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={smallInputClass} />;
    }
}

// onCreated: called with the created product doc — parent should refresh
// CategoryProductsBoard.
export default function ProductCreateForm({ onCreated }) {
    const [form, setForm] = useState(initialForm);
    const [categoryId, setCategoryId] = useState("");
    const [categoryFields, setCategoryFields] = useState([]);
    const [attributes, setAttributes] = useState({});
    const [images, setImages] = useState([]);
    const [isDraggingImages, setIsDraggingImages] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const set = (path, value) => {
        setForm((prev) => {
            const next = { ...prev };
            const keys = path.split(".");
            let cursor = next;
            for (let i = 0; i < keys.length - 1; i++) {
                cursor[keys[i]] = { ...cursor[keys[i]] };
                cursor = cursor[keys[i]];
            }
            cursor[keys[keys.length - 1]] = value;
            return next;
        });
    };

    const handleCategoryChange = (id, doc) => {
        setCategoryId(id);
        setCategoryFields((doc?.fields || []).slice().sort((a, b) => a.displayOrder - b.displayOrder));
        setAttributes({}); // reset attributes when category changes — old keys won't validate
    };

    const addImageFiles = (fileList) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;
        setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES));
    };

    const handleImageSelect = (e) => {
        addImageFiles(e.target.files);
        e.target.value = ""; // allow re-selecting the same file
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        setIsDraggingImages(false);
        addImageFiles(e.dataTransfer.files);
    };

    const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

    const validate = () => {
        if (!form.name.trim()) return "Product name is required.";
        if (!categoryId) return "Please select a category.";
        if (!form.supplier.trim()) return "Supplier name is required.";
        if (!form.pricing.purchasePrice || !form.pricing.sellingPrice) {
            return "Purchase price and selling price are both required.";
        }
        if (form.pricing.negotiation.enabled && !form.pricing.negotiation.minimumPrice) {
            return "Set a minimum price, or turn off negotiation.";
        }

        for (const field of categoryFields) {
            const val = attributes[field.key];
            const hasValue = val !== undefined && val !== null && val !== "";
            if (field.required && !hasValue) {
                return `"${field.name}" is required for this category.`;
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
            const pricing = {
                purchasePrice: Number(form.pricing.purchasePrice),
                sellingPrice: Number(form.pricing.sellingPrice),
                displayMode: form.pricing.displayMode,
                negotiation: form.pricing.negotiation.enabled
                    ? {
                          enabled: true,
                          minimumPrice: Number(form.pricing.negotiation.minimumPrice)
                      }
                    : { enabled: false }
            };

            const dimensions = {
                length: form.dimensions.length === "" ? undefined : Number(form.dimensions.length),
                width: form.dimensions.width === "" ? undefined : Number(form.dimensions.width),
                height: form.dimensions.height === "" ? undefined : Number(form.dimensions.height),
                unit: form.dimensions.unit
            };

            const product = await createProduct(
                {
                    name: form.name.trim(),
                    category: categoryId,
                    brand: form.brand.trim() || undefined,
                    description: form.description.trim() || undefined,
                    material: form.material.trim() || undefined,
                    color: form.color.trim() || undefined,
                    supplier: form.supplier.trim(),
                    outOfStockAction: form.outOfStockAction,
                    isFeatured: form.isFeatured,
                    isNewArrival: form.isNewArrival,
                    pricing,
                    dimensions,
                    attributes
                },
                images
            );

            // Two-step workaround: createProduct's controller doesn't parse
            // `stock` as JSON, so set it via a follow-up update call instead.
            if (form.initialStock !== "" && Number(form.initialStock) > 0) {
                await setInitialStock(product._id, { current: Number(form.initialStock) });
            }

            setForm(initialForm);
            setCategoryId("");
            setCategoryFields([]);
            setAttributes({});
            setImages([]);
            onCreated?.(product);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create product. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-7 sm:p-6 lg:p-7"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-indigo-600">
                        <path
                            d="M12 4v16m8-8H4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">New product</h2>
                    <p className="mt-0.5 text-sm text-slate-500">Add a product to the catalog.</p>
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

            {/* Basics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Product name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Category</label>
                    <CategorySelect value={categoryId} onChange={handleCategoryChange} label="" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Brand</label>
                    <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Supplier</label>
                    <input
                        type="text"
                        value={form.supplier}
                        onChange={(e) => set("supplier", e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Description</label>
                <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Material</label>
                    <input type="text" value={form.material} onChange={(e) => set("material", e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Color</label>
                    <input type="text" value={form.color} onChange={(e) => set("color", e.target.value)} className={inputClass} />
                </div>
            </div>

            {/* Dimensions */}
            <Section
                title="Dimensions"
                icon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                }
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {["length", "width", "height"].map((dim) => (
                        <div key={dim}>
                            <label className={`${smallLabelClass} capitalize`}>{dim}</label>
                            <input
                                type="number"
                                min="0"
                                value={form.dimensions[dim]}
                                onChange={(e) => set(`dimensions.${dim}`, e.target.value)}
                                className={smallInputClass}
                            />
                        </div>
                    ))}
                    <div>
                        <label className={smallLabelClass}>Unit</label>
                        <select
                            value={form.dimensions.unit}
                            onChange={(e) => set("dimensions.unit", e.target.value)}
                            className={smallInputClass}
                        >
                            <option value="cm">cm</option>
                            <option value="inch">inch</option>
                        </select>
                    </div>
                </div>
            </Section>

            {/* Pricing */}
            <Section
                title="Pricing"
                icon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path
                            d="M12 2v20M17 5.5H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H6.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        />
                    </svg>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className={smallLabelClass}>Purchase price</label>
                        <input
                            type="number"
                            min="0"
                            value={form.pricing.purchasePrice}
                            onChange={(e) => set("pricing.purchasePrice", e.target.value)}
                            className={smallInputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className={smallLabelClass}>Selling price</label>
                        <input
                            type="number"
                            min="0"
                            value={form.pricing.sellingPrice}
                            onChange={(e) => set("pricing.sellingPrice", e.target.value)}
                            className={smallInputClass}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className={smallLabelClass}>Price display</label>
                    <select
                        value={form.pricing.displayMode}
                        onChange={(e) => set("pricing.displayMode", e.target.value)}
                        className={smallInputClass}
                    >
                        <option value="show_price">Show price</option>
                        <option value="contact_for_price">Contact for price</option>
                        <option value="starting_from">Starting from price</option>
                    </select>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Toggle
                            checked={form.pricing.negotiation.enabled}
                            onChange={(v) => set("pricing.negotiation.enabled", v)}
                        />
                        Allow price negotiation
                    </label>
                    {form.pricing.negotiation.enabled && (
                        <div>
                            <label className={smallLabelClass}>Minimum acceptable price</label>
                            <input
                                type="number"
                                min="0"
                                value={form.pricing.negotiation.minimumPrice}
                                onChange={(e) => set("pricing.negotiation.minimumPrice", e.target.value)}
                                className={smallInputClass}
                            />
                        </div>
                    )}
                </div>
            </Section>

            {/* Stock & availability */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>
                        Starting stock <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={form.initialStock}
                        onChange={(e) => set("initialStock", e.target.value)}
                        placeholder="0"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>When out of stock</label>
                    <select
                        value={form.outOfStockAction}
                        onChange={(e) => set("outOfStockAction", e.target.value)}
                        className={inputClass}
                    >
                        <option value="show_as_out_of_stock">Show as "Out of Stock"</option>
                        <option value="hide">Hide from customers</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300">
                    <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
                    Featured product
                </label>
                <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300">
                    <Toggle checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} />
                    New arrival
                </label>
            </div>

            {/* Category-specific attributes */}
            {categoryFields.length > 0 && (
                <Section
                    title="Category-specific details"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                            <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    }
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {categoryFields.map((field) => (
                            <div key={field.key}>
                                <label className={smallLabelClass}>
                                    {field.name}
                                    {field.required && <span className="text-red-500"> *</span>}
                                </label>
                                <AttributeInput
                                    field={field}
                                    value={attributes[field.key]}
                                    onChange={(value) => setAttributes((prev) => ({ ...prev, [field.key]: value }))}
                                />
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Images */}
            <div>
                <label className={labelClass}>
                    Images <span className="font-normal text-slate-400">(up to {MAX_IMAGES})</span>
                </label>

                {images.length > 0 && (
                    <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                        {images.map((file, i) => (
                            <div key={i} className="group relative">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs leading-none text-white shadow transition hover:bg-slate-900"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {images.length < MAX_IMAGES && (
                    <label
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingImages(true);
                        }}
                        onDragLeave={() => setIsDraggingImages(false)}
                        onDrop={handleImageDrop}
                        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                            isDraggingImages ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-slate-400">
                            <path
                                d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <p className="text-sm text-slate-500">
                            <span className="font-medium text-indigo-600">Click to upload</span>
                            <span className="hidden sm:inline"> or drag and drop</span>
                        </p>
                        <p className="text-xs text-slate-400">{MAX_IMAGES - images.length} slot{MAX_IMAGES - images.length === 1 ? "" : "s"} left</p>
                        <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                    </label>
                )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting && (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-90" />
                        </svg>
                    )}
                    {submitting ? "Creating…" : "Create product"}
                </button>
            </div>
        </form>
    );
}