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

// Same input-per-type switch as ProductCreateForm's AttributeInput,
// duplicated here since the original isn't exported.
function AttributeInput({ field, value, onChange }) {
    const common = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

    switch (field.type) {
        case "textarea":
            return (
                <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2} className={common} />
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
                    className={common}
                />
            );
        case "boolean":
            return (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    Yes
                </label>
            );
        case "date":
            return <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common} />;
        case "url":
            return <input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common} />;
        case "color":
            return (
                <input
                    type="color"
                    value={value || "#000000"}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-16 rounded-md border border-slate-300"
                />
            );
        case "select":
            return (
                <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common}>
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
                            className={`rounded-full border px-3 py-1 text-xs ${
                                selected.includes(opt)
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-slate-300 text-slate-600"
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
            return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common} />;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={submitting ? undefined : onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Edit product</h2>
                        {categoryName && <p className="text-xs text-slate-400 mt-0.5">Category: {categoryName}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="text-slate-400 hover:text-slate-600 text-xl leading-none disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-slate-400 py-16 text-center">Loading product…</p>
                ) : loadError ? (
                    <p className="text-sm text-red-600 py-16 text-center">{loadError}</p>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Category <span className="text-slate-400 font-normal">(locked)</span>
                                </label>
                                <input
                                    type="text"
                                    value={categoryName}
                                    disabled
                                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={form.brand}
                                    onChange={(e) => set("brand", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                                <input
                                    type="text"
                                    value={form.supplier}
                                    onChange={(e) => set("supplier", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => set("description", e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                                <input
                                    type="text"
                                    value={form.material}
                                    onChange={(e) => set("material", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                <input
                                    type="text"
                                    value={form.color}
                                    onChange={(e) => set("color", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <fieldset className="rounded-lg border border-slate-200 p-4">
                            <legend className="px-1 text-sm font-medium text-slate-700">Dimensions</legend>
                            <div className="grid grid-cols-4 gap-3">
                                {["length", "width", "height"].map((dim) => (
                                    <div key={dim}>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 capitalize">
                                            {dim}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.dimensions[dim]}
                                            onChange={(e) => set(`dimensions.${dim}`, e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
                                    <select
                                        value={form.dimensions.unit}
                                        onChange={(e) => set("dimensions.unit", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    >
                                        <option value="cm">cm</option>
                                        <option value="inch">inch</option>
                                    </select>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="rounded-lg border border-slate-200 p-4">
                            <legend className="px-1 text-sm font-medium text-slate-700">Pricing</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Purchase price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.pricing.purchasePrice}
                                        onChange={(e) => set("pricing.purchasePrice", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Selling price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.pricing.sellingPrice}
                                        onChange={(e) => set("pricing.sellingPrice", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Price display</label>
                                <select
                                    value={form.pricing.displayMode}
                                    onChange={(e) => set("pricing.displayMode", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                >
                                    <option value="show_price">Show price</option>
                                    <option value="contact_for_price">Contact for price</option>
                                    <option value="starting_from">Starting from price</option>
                                </select>
                            </div>
                            <div className="mt-3 space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={form.pricing.negotiation.enabled}
                                        onChange={(e) => set("pricing.negotiation.enabled", e.target.checked)}
                                        className="rounded border-slate-300"
                                    />
                                    Allow price negotiation
                                </label>
                                {form.pricing.negotiation.enabled && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Minimum acceptable price
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.pricing.negotiation.minimumPrice}
                                            onChange={(e) => set("pricing.negotiation.minimumPrice", e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        <fieldset className="rounded-lg border border-slate-200 p-4">
                            <legend className="px-1 text-sm font-medium text-slate-700">Stock</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Current stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.stock.current}
                                        onChange={(e) => set("stock.current", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Low stock threshold</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.stock.lowStockThreshold}
                                        onChange={(e) => set("stock.lowStockThreshold", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">When out of stock</label>
                                <select
                                    value={form.outOfStockAction}
                                    onChange={(e) => set("outOfStockAction", e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="show_as_out_of_stock">Show as "Out of Stock"</option>
                                    <option value="hide">Hide from customers</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.isFeatured}
                                    onChange={(e) => set("isFeatured", e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                Featured product
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.isNewArrival}
                                    onChange={(e) => set("isNewArrival", e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                New arrival
                            </label>
                        </div>

                        {categoryFields.length > 0 && (
                            <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
                                <legend className="px-1 text-sm font-medium text-slate-700">
                                    Category-specific details
                                </legend>
                                {categoryFields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
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
                            </fieldset>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Images <span className="text-slate-400 font-normal">({totalImageCount}/{MAX_IMAGES})</span>
                            </label>

                            {existingImages.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {existingImages.map((img) => (
                                        <div key={img.publicId} className="relative">
                                            <img
                                                src={img.url}
                                                alt=""
                                                className="h-16 w-16 rounded-md object-cover border border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(img)}
                                                disabled={removingImageId === img.publicId}
                                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-700 text-white text-xs leading-5 disabled:opacity-50"
                                                aria-label="Remove image"
                                            >
                                                {removingImageId === img.publicId ? "…" : "×"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                disabled={totalImageCount >= MAX_IMAGES}
                                className="text-sm"
                            />
                            {newImages.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-3">
                                    {newImages.map((file, i) => (
                                        <div key={i} className="relative">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="h-16 w-16 rounded-md object-cover border border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(i)}
                                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-700 text-white text-xs leading-5"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {submitting ? "Saving…" : "Save changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}