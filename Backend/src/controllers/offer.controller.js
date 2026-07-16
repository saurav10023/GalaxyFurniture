// controllers/offer.controller.js
import mongoose from "mongoose";
import { Offer } from "../models/offer.model.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { Sale } from "../models/sale.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---- Shared validation for create/update ----
// Confirms the referenced product/category actually exists (and is active)
// before an offer is allowed to point at it. Brand offers only need a
// non-empty string since Product.brand isn't a linked collection.
const validateScopeTarget = async (scopeType, targetId, targetBrand) => {
    if (scopeType === "product") {
        if (!targetId || !mongoose.isValidObjectId(targetId)) {
            throw new ApiError(400, "A valid targetId (product id) is required");
        }
        const exists = await Product.exists({ _id: targetId });
        if (!exists) {
            throw new ApiError(404, "Target product not found");
        }
    } else if (scopeType === "category") {
        if (!targetId || !mongoose.isValidObjectId(targetId)) {
            throw new ApiError(400, "A valid targetId (category id) is required");
        }
        const category = await Category.findOne({ _id: targetId, isActive: true });
        if (!category) {
            throw new ApiError(404, "Target category not found or inactive");
        }
    } else if (scopeType === "brand") {
        if (!targetBrand || !targetBrand.trim()) {
            throw new ApiError(400, "targetBrand is required when scopeType is 'brand'");
        }
    } else {
        throw new ApiError(400, "scopeType must be one of: product, category, brand");
    }
};

const validateDiscount = (discountType, discountValue) => {
    if (!["percentage", "flat"].includes(discountType)) {
        throw new ApiError(400, "discountType must be 'percentage' or 'flat'");
    }
    const value = Number(discountValue);
    if (Number.isNaN(value) || value < 0) {
        throw new ApiError(400, "discountValue must be a non-negative number");
    }
    if (discountType === "percentage" && value > 100) {
        throw new ApiError(400, "Percentage discount cannot exceed 100");
    }
    return value;
};

const validateDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new ApiError(400, "startDate and endDate must be valid dates");
    }
    if (start >= end) {
        throw new ApiError(400, "endDate must be after startDate");
    }
    return { start, end };
};

// Applies a resolved offer to a selling price. Flat discounts never take
// a price below 0.
const computeDiscountedPrice = (sellingPrice, offer) => {
    if (offer.discountType === "percentage") {
        return Math.max(sellingPrice - (sellingPrice * offer.discountValue) / 100, 0);
    }
    return Math.max(sellingPrice - offer.discountValue, 0);
};

// ---- CREATE OFFER ----
// Admin only.
const createOffer = asyncHandler(async (req, res) => {
    const {
        name,
        scopeType,
        targetId,
        targetBrand,
        discountType,
        discountValue,
        tag,
        startDate,
        endDate,
        priority,
        isActive
    } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Offer name is required");
    }

    await validateScopeTarget(scopeType, targetId, targetBrand);
    const value = validateDiscount(discountType, discountValue);
    const { start, end } = validateDates(startDate, endDate);

    const offer = await Offer.create({
        name: name.trim(),
        scopeType,
        targetId: scopeType !== "brand" ? targetId : undefined,
        targetModel: scopeType === "product" ? "Product" : scopeType === "category" ? "Category" : undefined,
        targetBrand: scopeType === "brand" ? targetBrand.trim() : undefined,
        discountType,
        discountValue: value,
        tag: tag?.trim(),
        startDate: start,
        endDate: end,
        priority: priority !== undefined ? Number(priority) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res
        .status(201)
        .json(new ApiResponse(201, offer, "Offer created successfully"));
});

// ---- GET ALL OFFERS (paginated + filterable) ----
// Admin only. Query params: scopeType, tag, isActive, runningOnly (true =
// currently within startDate/endDate window AND isActive), page, limit.
const getAllOffers = asyncHandler(async (req, res) => {
    const { scopeType, tag, isActive, runningOnly, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (scopeType) {
        if (!["product", "category", "brand"].includes(scopeType)) {
            throw new ApiError(400, "Invalid scopeType filter");
        }
        filter.scopeType = scopeType;
    }

    if (tag) {
        filter.tag = { $regex: tag.trim(), $options: "i" };
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }

    if (runningOnly === "true") {
        const now = new Date();
        filter.isActive = true;
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [offers, total] = await Promise.all([
        Offer.find(filter)
            .populate("targetId", "name")
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Offer.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                offers,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            },
            "Offers fetched successfully"
        )
    );
});

// ---- GET SINGLE OFFER ----
const getOfferById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid offer id");
    }

    const offer = await Offer.findById(id).populate("targetId", "name");
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, offer, "Offer fetched successfully"));
});

// ---- UPDATE OFFER ----
// Admin only. scopeType itself is immutable once created — changing what
// kind of thing an offer targets is really a new offer, not an edit of
// this one (same immutability reasoning as Product.category).
const updateOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid offer id");
    }

    const offer = await Offer.findById(id);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    const {
        name,
        targetId,
        targetBrand,
        discountType,
        discountValue,
        tag,
        startDate,
        endDate,
        priority,
        isActive
    } = req.body;

    if (req.body.scopeType !== undefined && req.body.scopeType !== offer.scopeType) {
        throw new ApiError(400, "scopeType cannot be changed after creation. Create a new offer instead.");
    }

    if (name !== undefined) {
        if (!name.trim()) {
            throw new ApiError(400, "Offer name cannot be empty");
        }
        offer.name = name.trim();
    }

    // Re-validate target if it's being changed
    if (targetId !== undefined || targetBrand !== undefined) {
        const nextTargetId = targetId !== undefined ? targetId : offer.targetId;
        const nextTargetBrand = targetBrand !== undefined ? targetBrand : offer.targetBrand;
        await validateScopeTarget(offer.scopeType, nextTargetId, nextTargetBrand);

        if (offer.scopeType === "brand") {
            offer.targetBrand = nextTargetBrand.trim();
        } else {
            offer.targetId = nextTargetId;
        }
    }

    if (discountType !== undefined || discountValue !== undefined) {
        const nextType = discountType !== undefined ? discountType : offer.discountType;
        const nextValue = discountValue !== undefined ? discountValue : offer.discountValue;
        offer.discountType = nextType;
        offer.discountValue = validateDiscount(nextType, nextValue);
    }

    if (startDate !== undefined || endDate !== undefined) {
        const nextStart = startDate !== undefined ? startDate : offer.startDate;
        const nextEnd = endDate !== undefined ? endDate : offer.endDate;
        const { start, end } = validateDates(nextStart, nextEnd);
        offer.startDate = start;
        offer.endDate = end;
    }

    if (tag !== undefined) offer.tag = tag?.trim() || undefined;
    if (priority !== undefined) offer.priority = Number(priority);
    if (isActive !== undefined) offer.isActive = Boolean(isActive);

    await offer.save();

    return res
        .status(200)
        .json(new ApiResponse(200, offer, "Offer updated successfully"));
});

// ---- DELETE OFFER ----
const deleteOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid offer id");
    }

    const offer = await Offer.findById(id);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    await offer.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Offer deleted successfully"));
});

// ---- TOGGLE OFFER ACTIVE STATUS ----
const toggleOfferStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid offer id");
    }

    const offer = await Offer.findById(id);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    return res
        .status(200)
        .json(new ApiResponse(200, offer, `Offer ${offer.isActive ? "activated" : "deactivated"}`));
});

// ---- RESOLVE THE APPLICABLE OFFER FOR A PRODUCT ----
// Public-safe (no admin data leaked). Checks product-scoped, category-scoped,
// and brand-scoped offers that are currently running, and returns the
// highest-priority match (ties broken by most recently created). Used by
// the product detail page to show a struck-through original price.
const getApplicableOfferForProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const now = new Date();
    const runningFilter = { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } };

    const candidateOffers = await Offer.find({
        ...runningFilter,
        $or: [
            { scopeType: "product", targetId: product._id },
            { scopeType: "category", targetId: product.category },
            ...(product.brand ? [{ scopeType: "brand", targetBrand: product.brand }] : [])
        ]
    }).sort({ priority: -1, createdAt: -1 });

    const bestOffer = candidateOffers[0] || null;

    if (!bestOffer) {
        return res
            .status(200)
            .json(new ApiResponse(200, { offer: null }, "No active offer for this product"));
    }

    const discountedPrice = computeDiscountedPrice(product.pricing.sellingPrice, bestOffer);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                offer: bestOffer,
                originalPrice: product.pricing.sellingPrice,
                discountedPrice
            },
            "Applicable offer resolved successfully"
        )
    );
});

// ---- OFFER ANALYTICS ----
// Admin only. IMPORTANT LIMITATION: Sale/Payment snapshot product price
// and cost at time of sale, but do NOT currently snapshot which offer (if
// any) was applied. So this approximates performance by looking at sales
// of in-scope products that happened during the offer's active window —
// it cannot distinguish a sale that actually used the discount from one
// that happened to occur during the same window at full price. For exact
// attribution, Sale.items would need an `appliedOfferId` field set at
// time of sale — flagging this as a possible follow-up.
const getOfferAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid offer id");
    }

    const offer = await Offer.findById(id);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    // Build the set of product ids in scope for this offer
    let productIds;
    if (offer.scopeType === "product") {
        productIds = [offer.targetId];
    } else if (offer.scopeType === "category") {
        productIds = await Product.find({ category: offer.targetId }).distinct("_id");
    } else {
        productIds = await Product.find({ brand: offer.targetBrand }).distinct("_id");
    }

    const windowEnd = offer.endDate < new Date() ? offer.endDate : new Date();

    const [result] = await Sale.aggregate([
        {
            $match: {
                saleDate: { $gte: offer.startDate, $lte: windowEnd }
            }
        },
        { $unwind: "$items" },
        { $match: { "items.product": { $in: productIds } } },
        {
            $group: {
                _id: null,
                unitsSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.sellingPriceAtSale", "$items.quantity"] } },
                saleIds: { $addToSet: "$_id" }
            }
        },
        {
            $project: {
                _id: 0,
                unitsSold: 1,
                revenue: 1,
                salesCount: { $size: "$saleIds" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                offer: { id: offer._id, name: offer.name, scopeType: offer.scopeType },
                window: { from: offer.startDate, to: windowEnd },
                unitsSold: result?.unitsSold || 0,
                revenue: result?.revenue || 0,
                salesCount: result?.salesCount || 0,
                note: "Approximate — based on in-scope product sales during the offer window, not exact per-sale offer attribution."
            },
            "Offer analytics fetched successfully"
        )
    );
});

export {
    createOffer,
    getAllOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    getApplicableOfferForProduct,
    getOfferAnalytics
};