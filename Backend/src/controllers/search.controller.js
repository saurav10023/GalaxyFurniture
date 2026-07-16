// controllers/search.controller.js
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { buildProductQuery } from "../utils/buildProductQuery.js";
import { buildSortQuery } from "../utils/buildSortQuery.js";
import { publicVisibilityFilter } from "../utils/productVisibility.js";
import { sanitizeProductList } from "../utils/sanitizeProduct.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/v1/products/search?q=sofa&category=<id>&brand=Ikea&minPrice=1000
//     &maxPrice=50000&attributes[material]=Leather&sort=price-asc&page=1&limit=20
const searchProducts = asyncHandler(async (req, res) => {
    const { sort, page = 1, limit = 20 } = req.query;

    const isAdmin = req.user?.role === "admin";

    let filter;
    try {
        filter = buildProductQuery(req.query, isAdmin);
    } catch (err) {
        throw new ApiError(400, err.message);
    }

    const sortQuery = buildSortQuery(sort);
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
        Product.find(filter).sort(sortQuery).skip(skip).limit(Number(limit)),
        Product.countDocuments(filter)
    ]);

    const sanitized = sanitizeProductList(products, isAdmin);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products: sanitized,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            },
            "Products fetched successfully"
        )
    );
});

// GET /api/v1/products/filters/:categoryId
// Tells the frontend which filters to render for a category. Since your
// categories are admin-defined, this is derived from the Category document
// itself (its fields[] already carry name/key/type/options), NOT a static
// hardcoded map. Also returns the price range and distinct brands present
// in that category so the frontend can build a price slider / brand list.
const getAvailableFilters = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid category id");
    }

    const category = await Category.findOne({ _id: categoryId, isActive: true });
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const [priceRange, brands] = await Promise.all([
        Product.aggregate([
            { $match: { category: category._id, ...publicVisibilityFilter } },
            {
                $group: {
                    _id: null,
                    min: { $min: "$pricing.sellingPrice" },
                    max: { $max: "$pricing.sellingPrice" }
                }
            }
        ]),
        Product.distinct("brand", {
            category: category._id,
            ...publicVisibilityFilter,
            brand: { $exists: true, $ne: null, $ne: "" }
        })
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                // dynamic per-category attribute filters (material, seating
                // capacity, closure type, etc.) — straight from admin config
                attributeFields: category.fields.map((f) => ({
                    name: f.name,
                    key: f.key,
                    type: f.type,
                    options: f.options || undefined
                })),
                brands,
                priceRange: priceRange[0]
                    ? { min: priceRange[0].min, max: priceRange[0].max }
                    : { min: 0, max: 0 }
            },
            "Available filters fetched"
        )
    );
});

// GET /api/v1/products/brands?category=<categoryId>
// Distinct brands within a category, with counts + a sample image for a
// brand chip strip on the customer catalog screen.
const getBrandsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.query;

    if (!category || !mongoose.isValidObjectId(category)) {
        throw new ApiError(400, "A valid category id is required");
    }

    const categoryExists = await Category.exists({ _id: category });
    if (!categoryExists) {
        throw new ApiError(404, "Category not found");
    }

    const isAdmin = req.user?.role === "admin";

    const matchStage = {
        category: new mongoose.Types.ObjectId(category),
        brand: { $exists: true, $ne: null, $ne: "" },
        ...(isAdmin ? {} : publicVisibilityFilter)
    };

    const brands = await Product.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$brand",
                productCount: { $sum: 1 },
                sampleImage: { $first: "$images" }
            }
        },
        { $sort: { productCount: -1 } },
        {
            $project: {
                _id: 0,
                brand: "$_id",
                productCount: 1,
                sampleImage: { $arrayElemAt: ["$sampleImage.url", 0] }
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, brands, "Brands fetched successfully"));
});

export { searchProducts, getAvailableFilters, getBrandsByCategory };