// controllers/product.controller.js
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { sanitizeProduct, sanitizeProductList } from "../utils/sanitizeProduct.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_IMAGES = 5;

// Query filter that hides products the customer should never see:
// inactive, OR out of stock with outOfStockAction = "hide"
const publicVisibilityFilter = {
    isActive: true,
    $or: [
        { "stock.current": { $gt: 0 } },
        { outOfStockAction: "show_as_out_of_stock" }
    ]
};

// ---- VALIDATE PRODUCT ATTRIBUTES AGAINST CATEGORY FIELD DEFINITIONS ----
// Runs on both create and update. Checks: required fields present,
// type correctness, select/multiselect values within allowed options,
// and validation rules (min/max, length, pattern).
// Unknown keys not defined on the category are rejected — prevents typos
// and stray data from silently living in the attributes Map forever.
const validateAttributesAgainstCategory = (attributes, categoryFields) => {
    const attrs = attributes || {};
    const fieldByKey = new Map(categoryFields.map((f) => [f.key, f]));

    // Reject attribute keys the category doesn't define
    for (const key of Object.keys(attrs)) {
        if (!fieldByKey.has(key)) {
            throw new ApiError(400, `Unknown attribute "${key}" for this category`);
        }
    }

    for (const field of categoryFields) {
        const value = attrs[field.key];
        const hasValue = value !== undefined && value !== null && value !== "";

        if (field.required && !hasValue) {
            throw new ApiError(400, `Attribute "${field.name}" is required`);
        }

        if (!hasValue) continue; // optional and not provided — skip further checks

        switch (field.type) {
            case "text":
            case "textarea":
            case "url":
            case "color":
                if (typeof value !== "string") {
                    throw new ApiError(400, `Attribute "${field.name}" must be a string`);
                }
                if (field.validation?.minLength && value.length < field.validation.minLength) {
                    throw new ApiError(400, `Attribute "${field.name}" must be at least ${field.validation.minLength} characters`);
                }
                if (field.validation?.maxLength && value.length > field.validation.maxLength) {
                    throw new ApiError(400, `Attribute "${field.name}" must be at most ${field.validation.maxLength} characters`);
                }
                if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
                    throw new ApiError(400, `Attribute "${field.name}" is not in a valid format`);
                }
                break;

            case "number":
            case "decimal":
                if (typeof value !== "number" || Number.isNaN(value)) {
                    throw new ApiError(400, `Attribute "${field.name}" must be a number`);
                }
                if (field.validation?.min !== undefined && value < field.validation.min) {
                    throw new ApiError(400, `Attribute "${field.name}" must be at least ${field.validation.min}`);
                }
                if (field.validation?.max !== undefined && value > field.validation.max) {
                    throw new ApiError(400, `Attribute "${field.name}" must be at most ${field.validation.max}`);
                }
                break;

            case "boolean":
                if (typeof value !== "boolean") {
                    throw new ApiError(400, `Attribute "${field.name}" must be true or false`);
                }
                break;

            case "date":
                if (Number.isNaN(Date.parse(value))) {
                    throw new ApiError(400, `Attribute "${field.name}" must be a valid date`);
                }
                break;

            case "select":
                if (!field.options?.includes(value)) {
                    throw new ApiError(400, `Attribute "${field.name}" must be one of: ${field.options?.join(", ")}`);
                }
                break;

            case "multiselect":
                if (!Array.isArray(value) || value.some((v) => !field.options?.includes(v))) {
                    throw new ApiError(400, `Attribute "${field.name}" must be an array of: ${field.options?.join(", ")}`);
                }
                break;

            default:
                break;
        }
    }
};

// ---- CREATE PRODUCT ----
// Admin only.
const createProduct = asyncHandler(async (req, res) => {
    const { category, supplier } = req.body;

    if (!category || !mongoose.isValidObjectId(category)) {
        throw new ApiError(400, "A valid category id is required");
    }

    // Supplier is a plain free-text name, not a linked collection — just
    // needs to be a non-empty string.
    if (!supplier || !supplier.trim()) {
        throw new ApiError(400, "Supplier name is required");
    }

    const categoryDoc = await Category.findOne({ _id: category, isActive: true });
    if (!categoryDoc) {
        throw new ApiError(400, "Category not found or inactive");
    }

    const parseJsonField = (value, fieldName) => {
        if (typeof value !== "string") return value;
        try {
            return JSON.parse(value);
        } catch {
            throw new ApiError(400, `Invalid ${fieldName} format`);
        }
    };

    const pricing = parseJsonField(req.body.pricing, "pricing");
    const attributes = parseJsonField(req.body.attributes, "attributes");
    const dimensions = parseJsonField(req.body.dimensions, "dimensions");

    if (!pricing?.purchasePrice || !pricing?.sellingPrice) {
        throw new ApiError(400, "purchasePrice and sellingPrice are required");
    }

    validateAttributesAgainstCategory(attributes, categoryDoc.fields);

    // Handle image uploads (optional)
    const files = req.files || [];
    if (files.length > MAX_IMAGES) {
        throw new ApiError(400, `A maximum of ${MAX_IMAGES} images is allowed`);
    }

    const uploadedImages = [];
    for (const file of files) {
        const result = await uploadOnCloudinary(file.path);
        if (!result?.url || !result?.public_id) {
            throw new ApiError(500, "Error uploading one or more images");
        }
        uploadedImages.push({ url: result.url, publicId: result.public_id });
    }

    const productData = {
        ...req.body,
        supplier: supplier.trim(),
        pricing,
        attributes,
        dimensions,
        images: uploadedImages.length > 0 ? uploadedImages : undefined
    };

    // .create() runs the schema's pre("save") hook (slug/sku generation,
    // pricing validation) — do not bypass this with insertMany or lean writes.
    const product = await Product.create(productData);

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});

// ---- UPDATE PRODUCT ----
// Admin only. Fetch-mutate-save (NOT findByIdAndUpdate) so the model's
// pre("save") hook — pricing validation, negotiation checks — still runs.
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const parseJsonField = (value, fieldName) => {
        if (typeof value !== "string") return value;
        try {
            return JSON.parse(value);
        } catch {
            throw new ApiError(400, `Invalid ${fieldName} format`);
        }
    };

    const {
        name, description, material, color, brand, supplier,
        outOfStockAction, isFeatured, isNewArrival
    } = req.body;

    const incomingPricing = parseJsonField(req.body.pricing, "pricing");
    const incomingAttributes = parseJsonField(req.body.attributes, "attributes");
    const incomingDimensions = parseJsonField(req.body.dimensions, "dimensions");
    const incomingStock = parseJsonField(req.body.stock, "stock");

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (material !== undefined) product.material = material;
    if (color !== undefined) product.color = color;
    if (brand !== undefined) product.brand = brand;
    if (outOfStockAction !== undefined) product.outOfStockAction = outOfStockAction;
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);

    if (supplier !== undefined) {
        if (!supplier.trim()) {
            throw new ApiError(400, "Supplier name cannot be empty");
        }
        product.supplier = supplier.trim();
    }

    if (incomingDimensions) {
        product.dimensions = { ...product.dimensions?.toObject?.(), ...incomingDimensions };
    }

    if (incomingStock) {
        product.stock = { ...product.stock?.toObject?.(), ...incomingStock };
    }

    let mergedAttributes;
    if (incomingAttributes) {
        const currentAttrs = product.attributes instanceof Map
            ? Object.fromEntries(product.attributes)
            : product.attributes || {};
        mergedAttributes = { ...currentAttrs, ...incomingAttributes };

        // category is immutable on update, so validate merged attributes
        // against the product's existing category definition
        const categoryDoc = await Category.findById(product.category);
        if (!categoryDoc) {
            throw new ApiError(400, "This product's category no longer exists");
        }
        validateAttributesAgainstCategory(mergedAttributes, categoryDoc.fields);

        product.attributes = mergedAttributes;
    }

    // Merge pricing manually — Mixed/nested subdocument assignment
    // replaces the whole object, not a shallow merge.
    if (incomingPricing) {
        const existingPricing = product.pricing?.toObject
            ? product.pricing.toObject()
            : product.pricing || {};

        const { negotiation: incomingNegotiation, ...restPricing } = incomingPricing;

        const mergedPricing = { ...existingPricing, ...restPricing };

        if (incomingNegotiation === null) {
            delete mergedPricing.negotiation;
        } else if (incomingNegotiation !== undefined) {
            mergedPricing.negotiation = {
                ...(existingPricing.negotiation || {}),
                ...incomingNegotiation
            };
        }

        product.pricing = mergedPricing;
    }

    // Category is intentionally immutable after creation — changing it would
    // orphan attributes keyed to the old category's field definitions.
    // Reassigning category is not supported through this endpoint.

    // Optional image upload — enforce the 5-image cap against the FINAL count
    const files = req.files || [];
    if (files.length > 0) {
        if (product.images.length + files.length > MAX_IMAGES) {
            throw new ApiError(
                400,
                `This product already has ${product.images.length} image(s); max ${MAX_IMAGES} allowed`
            );
        }

        for (const file of files) {
            const result = await uploadOnCloudinary(file.path);
            if (!result?.url || !result?.public_id) {
                throw new ApiError(500, "Error uploading image");
            }
            product.images.push({ url: result.url, publicId: result.public_id });
        }
    }

    await product.save(); // runs pre("save") validation

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

// ---- ADD IMAGES TO EXISTING PRODUCT ----
const addProductImages = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const files = req.files || [];
    if (files.length === 0) {
        throw new ApiError(400, "At least one image file is required");
    }

    if (product.images.length + files.length > MAX_IMAGES) {
        throw new ApiError(
            400,
            `This product already has ${product.images.length} image(s); max ${MAX_IMAGES} allowed`
        );
    }

    for (const file of files) {
        const result = await uploadOnCloudinary(file.path);
        if (!result?.url || !result?.public_id) {
            throw new ApiError(500, "Error uploading one or more images");
        }
        product.images.push({ url: result.url, publicId: result.public_id });
    }

    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Images added successfully"));
});

// ---- REMOVE A SPECIFIC IMAGE FROM A PRODUCT ----
const removeProductImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { publicId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid product id");
    }
    if (!publicId) {
        throw new ApiError(400, "publicId is required");
    }

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const imageExists = product.images.some((img) => img.publicId === publicId);
    if (!imageExists) {
        throw new ApiError(404, "Image not found on this product");
    }

    await deleteFromCloudinary(publicId);

    product.images = product.images.filter((img) => img.publicId !== publicId);
    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Image removed successfully"));
});

// ---- DELETE PRODUCT ----
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    for (const img of product.images || []) {
        if (img?.publicId) {
            await deleteFromCloudinary(img.publicId);
        }
    }

    await product.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

// ---- GET SINGLE PRODUCT (ADMIN) ----
// Protected route — mount behind verifyjwt + verifyAdmin.
// Never filtered by availability, never sanitized.
const getProductByIdAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid product id");
    }

    // supplier is now a plain string field, not a ref — nothing to populate there
    const product = await Product.findById(id).populate("category");
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

// ---- GET SINGLE PRODUCT (PUBLIC) ----
const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
    const product = await Product.findOne(query).populate("category", "name slug fields");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Respects the admin's out-of-stock show/hide preference, not just isActive
    if (product.availabilityStatus === "hidden") {
        throw new ApiError(404, "Product not found");
    }

    const isAdmin = req.user?.role === "admin";
    const sanitized = sanitizeProduct(product, isAdmin);

    return res
        .status(200)
        .json(new ApiResponse(200, sanitized, "Product fetched successfully"));
});

// ---- GET ALL PRODUCTS (basic listing — search/filter lives in search.controller.js) ----
const getAllProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const isAdmin = req.user?.role === "admin";
    const filter = isAdmin ? {} : publicVisibilityFilter;

    const [products, total] = await Promise.all([
        Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Product.countDocuments(filter)
    ]);

    const sanitized = sanitizeProductList(products, isAdmin);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products: sanitized,
                pagination: { total, page, pages: Math.ceil(total / limit) }
            },
            "Products fetched successfully"
        )
    );
});

// ---- TOGGLE PRODUCT ACTIVE STATUS ----
// Admin only. Soft delete / re-list without removing data.
const toggleProductStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    product.isActive = !product.isActive;
    await product.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, product, `Product ${product.isActive ? "activated" : "deactivated"}`)
        );
});

export {
    createProduct,
    updateProduct,
    addProductImages,
    removeProductImage,
    deleteProduct,
    getProductById,
    getProductByIdAdmin,
    getAllProducts,
    toggleProductStatus
};