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

// Renders one input, matched to the field's type, for a category's
// custom attributes — mirrors the type switch in
// validateAttributesAgainstCategory() on the backend.
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
            return <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-16 rounded-md border border-slate-300" />;
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

// onCreated: called with the created product doc — parent should refresh
// CategoryProductsBoard.
export default function ProductCreateForm({ onCreated }) {
    const [form, setForm] = useState(initialForm);
    const [categoryId, setCategoryId] = useState("");
    const [categoryFields, setCategoryFields] = useState([]);
    const [attributes, setAttributes] = useState({});
    const [images, setImages] = useState([]);
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

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setImages((prev) => {
            const combined = [...prev, ...files].slice(0, MAX_IMAGES);
            return combined;
        });
        e.target.value = ""; // allow re-selecting the same file
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
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">New product</h2>
                <p className="text-sm text-slate-500 mt-0.5">Add a product to the catalog.</p>
            </div>

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
                <CategorySelect value={categoryId} onChange={handleCategoryChange} />
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
                            <label className="block text-xs font-medium text-slate-500 mb-1 capitalize">{dim}</label>
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
                            <label className="block text-xs font-medium text-slate-500 mb-1">Minimum acceptable price</label>
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Starting stock <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={form.initialStock}
                        onChange={(e) => set("initialStock", e.target.value)}
                        placeholder="0"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
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
                    Images <span className="text-slate-400 font-normal">(up to {MAX_IMAGES})</span>
                </label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={images.length >= MAX_IMAGES}
                    className="text-sm"
                />
                {images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3">
                        {images.map((file, i) => (
                            <div key={i} className="relative">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="h-16 w-16 rounded-md object-cover border border-slate-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
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

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? "Creating…" : "Create product"}
                </button>
            </div>
        </form>
    );
}