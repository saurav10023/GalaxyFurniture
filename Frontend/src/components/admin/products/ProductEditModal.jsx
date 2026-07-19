// src/components/admin/products/ProductEditModal.jsx
//
// Fetches the full admin product doc on open (getProductByIdAdmin, which
// populates category incl. its field definitions) rather than trusting
// whatever partial shape was passed in from the list, since the list
// endpoint doesn't populate category. Category itself is immutable here —
// matches the backend, which doesn't accept category changes on update.

import { useEffect, useState } from "react";
import {
    getProductByIdAdmin,
    updateProduct,
    removeProductImage
} from "../../../api/admin/products.api";

const MAX_IMAGES = 5;

const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
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

function Section({ title, children }) {
    return (
        <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700">{title}</legend>
            <div className="mt-2 space-y-3">{children}</div>
        </fieldset>
    );
}

// Same input-per-type switch as ProductCreateForm's AttributeInput,
// duplicated here since the original isn't exported.
function AttributeInput({ field, value, onChange }) {
    switch (field.type) {
        case "textarea":
            return (
                <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2} className={inputClass} />
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
                    className={inputClass}
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
            return <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
        case "url":
            return <input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
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
                <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass}>
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
            return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }
}

function toPlainAttributes(attributes) {
    if (attributes instanceof Map) return Object.fromEntries(attributes);
    return attributes || {};
}

// product: at minimum needs _id — full data is fetched fresh on open.
// onClose(): dismiss without further action.
// onUpdated(updatedProduct): tell the parent (CategoryProductsBoard) to
// refresh its list with the latest doc.
export default function ProductEditModal({ product, onClose, onUpdated }) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [categoryFields, setCategoryFields] = useState([]);
    const [categoryName, setCategoryName] = useState("");

    const [form, setForm] = useState(null); // populated once the full doc loads
    const [attributes, setAttributes] = useState({});
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [removingImageId, setRemovingImageId] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setLoadError(null);
            try {
                const full = await getProductByIdAdmin(product._id);
                if (cancelled) return;

                setCategoryName(full.category?.name || "");
                setCategoryFields(
                    (full.category?.fields || []).slice().sort((a, b) => a.displayOrder - b.displayOrder)
                );

                setForm({
                    name: full.name || "",
                    brand: full.brand || "",
                    description: full.description || "",
                    material: full.material || "",
                    color: full.color || "",
                    supplier: full.supplier || "",
                    outOfStockAction: full.outOfStockAction || "show_as_out_of_stock",
                    isFeatured: Boolean(full.isFeatured),
                    isNewArrival: Boolean(full.isNewArrival),
                    isActive: Boolean(full.isActive),
                    dimensions: {
                        length: full.dimensions?.length ?? "",
                        width: full.dimensions?.width ?? "",
                        height: full.dimensions?.height ?? "",
                        unit: full.dimensions?.unit || "cm"
                    },
                    pricing: {
                        purchasePrice: full.pricing?.purchasePrice ?? "",
                        sellingPrice: full.pricing?.sellingPrice ?? "",
                        displayMode: full.pricing?.displayMode || "show_price",
                        negotiation: {
                            enabled: Boolean(full.pricing?.negotiation?.enabled),
                            minimumPrice: full.pricing?.negotiation?.minimumPrice ?? ""
                        }
                    },
                    stock: {
                        current: full.stock?.current ?? 0,
                        lowStockThreshold: full.stock?.lowStockThreshold ?? 0
                    }
                });

                setAttributes(toPlainAttributes(full.attributes));
                setExistingImages(full.images || []);
            } catch (err) {
                if (!cancelled) {
                    setLoadError(err?.response?.data?.message || "Couldn't load this product.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [product._id]);

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

    const totalImageCount = existingImages.length + newImages.length;

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setNewImages((prev) => [...prev, ...files].slice(0, Math.max(0, MAX_IMAGES - existingImages.length)));
        e.target.value = "";
    };

    const removeNewImage = (index) => setNewImages((prev) => prev.filter((_, i) => i !== index));

    const removeExistingImage = async (img) => {
        if (!window.confirm("Remove this image? This can't be undone.")) return;
        setRemovingImageId(img.publicId);
        try {
            await removeProductImage(product._id, img.publicId);
            setExistingImages((prev) => prev.filter((i) => i.publicId !== img.publicId));
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't remove that image.");
        } finally {
            setRemovingImageId(null);
        }
    };

    const validate = () => {
        if (!form.name.trim()) return "Product name is required.";
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

            const stock = {
                current: Number(form.stock.current),
                lowStockThreshold: Number(form.stock.lowStockThreshold)
            };

            const updated = await updateProduct(
                product._id,
                {
                    name: form.name.trim(),
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
                    stock,
                    attributes
                },
                newImages
            );

            onUpdated?.(updated);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update product. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={submitting ? undefined : onClose} />

            <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-slate-900">Edit product</h2>
                        {categoryName && <p className="mt-0.5 truncate text-xs text-slate-400">Category: {categoryName}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                        aria-label="Close"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-20">
                            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 animate-spin text-indigo-500">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <p className="text-sm text-slate-400">Loading product…</p>
                        </div>
                    ) : loadError ? (
                        <p className="py-20 text-center text-sm text-red-600">{loadError}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

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
                                    <label className={labelClass}>
                                        Category <span className="font-normal text-slate-400">(locked)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={categoryName}
                                        disabled
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Brand</label>
                                    <input
                                        type="text"
                                        value={form.brand}
                                        onChange={(e) => set("brand", e.target.value)}
                                        className={inputClass}
                                    />
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
                                    <input
                                        type="text"
                                        value={form.material}
                                        onChange={(e) => set("material", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Color</label>
                                    <input
                                        type="text"
                                        value={form.color}
                                        onChange={(e) => set("color", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <Section title="Dimensions">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {["length", "width", "height"].map((dim) => (
                                        <div key={dim}>
                                            <label className={`${smallLabelClass} capitalize`}>{dim}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.dimensions[dim]}
                                                onChange={(e) => set(`dimensions.${dim}`, e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className={smallLabelClass}>Unit</label>
                                        <select
                                            value={form.dimensions.unit}
                                            onChange={(e) => set("dimensions.unit", e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="cm">cm</option>
                                            <option value="inch">inch</option>
                                        </select>
                                    </div>
                                </div>
                            </Section>

                            <Section title="Pricing">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={smallLabelClass}>Purchase price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.pricing.purchasePrice}
                                            onChange={(e) => set("pricing.purchasePrice", e.target.value)}
                                            className={inputClass}
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
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={smallLabelClass}>Price display</label>
                                    <select
                                        value={form.pricing.displayMode}
                                        onChange={(e) => set("pricing.displayMode", e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="show_price">Show price</option>
                                        <option value="contact_for_price">Contact for price</option>
                                        <option value="starting_from">Starting from price</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
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
                                                className={inputClass}
                                            />
                                        </div>
                                    )}
                                </div>
                            </Section>

                            <Section title="Stock">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={smallLabelClass}>Current stock</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.stock.current}
                                            onChange={(e) => set("stock.current", e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={smallLabelClass}>Low stock threshold</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.stock.lowStockThreshold}
                                            onChange={(e) => set("stock.lowStockThreshold", e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </Section>

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

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
                                    <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
                                    Featured product
                                </label>
                                <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
                                    <Toggle checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} />
                                    New arrival
                                </label>
                            </div>

                            {categoryFields.length > 0 && (
                                <Section title="Category-specific details">
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

                            <div>
                                <label className={labelClass}>
                                    Images <span className="font-normal text-slate-400">({totalImageCount}/{MAX_IMAGES})</span>
                                </label>

                                {existingImages.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-3">
                                        {existingImages.map((img) => (
                                            <div key={img.publicId} className="relative">
                                                <img
                                                    src={img.url}
                                                    alt=""
                                                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(img)}
                                                    disabled={removingImageId === img.publicId}
                                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs leading-none text-white shadow disabled:opacity-50"
                                                    aria-label="Remove image"
                                                >
                                                    {removingImageId === img.publicId ? "…" : "×"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <label
                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-center text-sm transition ${
                                        totalImageCount >= MAX_IMAGES
                                            ? "cursor-not-allowed border-slate-100 text-slate-300"
                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                        <path
                                            d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Add images
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        disabled={totalImageCount >= MAX_IMAGES}
                                        className="hidden"
                                    />
                                </label>

                                {newImages.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-3">
                                        {newImages.map((file, i) => (
                                            <div key={i} className="relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(i)}
                                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs leading-none text-white shadow"
                                                    aria-label={`Remove ${file.name}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting && (
                                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
                                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                            <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {submitting ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}