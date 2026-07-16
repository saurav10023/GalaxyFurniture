// controllers/category.controller.js
import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ALLOWED_FIELD_TYPES = [
    "text",
    "number",
    "decimal",
    "boolean",
    "select",
    "multiselect",
    "date",
    "textarea",
    "url",
    "color"
];

// ---- CREATE CATEGORY ----
// Admin only. Category name + optional dynamic field definitions.
const createCategory = asyncHandler(async (req, res) => {
    const { name, description, isFeatured, fields } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Category name is required");
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
        throw new ApiError(409, "A category with this name already exists");
    }

    const category = await Category.create({
        name: name.trim(),
        description,
        isFeatured: Boolean(isFeatured),
        fields: Array.isArray(fields) ? fields : []
    });

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});

// ---- GET ALL CATEGORIES ----
// Public (customer site) gets only active categories.
// Admin gets everything, including inactive ones, via ?includeInactive=true.
const getAllCategories = asyncHandler(async (req, res) => {
    const { includeInactive, featuredOnly } = req.query;

    const filter = {};

    if (!(req.user?.role === "admin" && includeInactive === "true")) {
        filter.isActive = true;
    }

    if (featuredOnly === "true") {
        filter.isFeatured = true;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

// ---- GET CATEGORY BY ID OR SLUG ----
const getCategory = asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    const query = mongoose.isValidObjectId(idOrSlug)
        ? { _id: idOrSlug }
        : { slug: idOrSlug };

    const category = await Category.findOne(query);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"));
});

// ---- UPDATE CATEGORY (name, description, featured, active) ----
// Does NOT touch `fields` — use the dedicated field endpoints below,
// since changing field structure has side effects on existing Products.
const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name, description, isFeatured, isActive } = req.body;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    if (name && name.trim() !== category.name) {
        const duplicate = await Category.findOne({
            name: name.trim(),
            _id: { $ne: categoryId }
        });
        if (duplicate) {
            throw new ApiError(409, "A category with this name already exists");
        }
        category.name = name.trim();
        category.slug = undefined; // force regeneration in pre-save hook
    }

    if (description !== undefined) category.description = description;
    if (isFeatured !== undefined) category.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});

// ---- DEACTIVATE CATEGORY (soft delete) ----
// Spec: categories are referenced by Product via ObjectId, so hard delete
// would orphan products. Deactivating hides it from the customer catalog
// without breaking existing product references.
const deactivateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const category = await Category.findByIdAndUpdate(
        categoryId,
        { isActive: false },
        { new: true }
    );

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category deactivated successfully"));
});

const activateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const category = await Category.findByIdAndUpdate(
        categoryId,
        { isActive: true },
        { new: true }
    );

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category activated successfully"));
});

// ---- HARD DELETE CATEGORY ----
// Only allowed if no products reference this category — prevents orphaned
// Product.category references, since that field is required on Product.
const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete category: ${productCount} product(s) still reference it. Deactivate it instead.`
        );
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

// ---- ADD DYNAMIC FIELD ----
const addCategoryField = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name, key, type, required, options, validation, displayOrder } = req.body;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    if (!name || !key || !type) {
        throw new ApiError(400, "Field name, key, and type are required");
    }

    if (!ALLOWED_FIELD_TYPES.includes(type)) {
        throw new ApiError(400, `Invalid field type. Allowed: ${ALLOWED_FIELD_TYPES.join(", ")}`);
    }

    if (["select", "multiselect"].includes(type) && (!options || options.length === 0)) {
        throw new ApiError(400, `Field type "${type}" requires at least one option`);
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const normalizedKey = key.trim().toLowerCase();
    const keyExists = category.fields.some((f) => f.key === normalizedKey);
    if (keyExists) {
        throw new ApiError(409, `A field with key "${normalizedKey}" already exists in this category`);
    }

    category.fields.push({
        name: name.trim(),
        key: normalizedKey,
        type,
        required: Boolean(required),
        options: options || undefined,
        validation: validation || undefined,
        displayOrder: displayOrder ?? category.fields.length
    });

    await category.save();

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Field added successfully"));
});

// ---- UPDATE DYNAMIC FIELD ----
// Note: renaming/retyping a field after products already store data under
// its old key will orphan that data in Product.attributes. Warn the admin
// client-side; this endpoint only guards structural integrity.
const updateCategoryField = asyncHandler(async (req, res) => {
    const { categoryId, fieldKey } = req.params;
    const { name, type, required, options, validation, displayOrder } = req.body;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const field = category.fields.find((f) => f.key === fieldKey);
    if (!field) {
        throw new ApiError(404, `Field with key "${fieldKey}" not found`);
    }

    if (type && !ALLOWED_FIELD_TYPES.includes(type)) {
        throw new ApiError(400, `Invalid field type. Allowed: ${ALLOWED_FIELD_TYPES.join(", ")}`);
    }

    const finalType = type || field.type;
    const finalOptions = options !== undefined ? options : field.options;

    if (["select", "multiselect"].includes(finalType) && (!finalOptions || finalOptions.length === 0)) {
        throw new ApiError(400, `Field type "${finalType}" requires at least one option`);
    }

    if (name !== undefined) field.name = name.trim();
    if (type !== undefined) field.type = type;
    if (required !== undefined) field.required = Boolean(required);
    if (options !== undefined) field.options = options;
    if (validation !== undefined) field.validation = validation;
    if (displayOrder !== undefined) field.displayOrder = displayOrder;

    await category.save();

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Field updated successfully"));
});

// ---- REMOVE DYNAMIC FIELD ----
const removeCategoryField = asyncHandler(async (req, res) => {
    const { categoryId, fieldKey } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const fieldExists = category.fields.some((f) => f.key === fieldKey);
    if (!fieldExists) {
        throw new ApiError(404, `Field with key "${fieldKey}" not found`);
    }

    category.fields = category.fields.filter((f) => f.key !== fieldKey);
    await category.save();

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Field removed successfully"));
});

export {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    activateCategory,
    deactivateCategory,
    deleteCategory,
    addCategoryField,
    updateCategoryField,
    removeCategoryField
};