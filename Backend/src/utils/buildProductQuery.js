// utils/buildProductQuery.js
import mongoose from "mongoose";
import { publicVisibilityFilter } from "./productVisibility.js";

// Builds a Mongo filter from arbitrary query-string params.
// Supports: text search, category, brand, material, color, price range,
// featured/new-arrival flags, and dynamic category attributes
// (passed as attributes[key]=value, since attributes is a Map on Product).
const buildProductQuery = (queryParams, isAdmin) => {
    const {
        q,
        category,
        brand,
        material,
        color,
        minPrice,
        maxPrice,
        isFeatured,
        isNewArrival,
        attributes
    } = queryParams;

    const filter = isAdmin ? {} : { ...publicVisibilityFilter };

    if (q && q.trim()) {
        const regex = new RegExp(q.trim(), "i");
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ name: regex }, { description: regex }, { brand: regex }] }
        ];
    }

    if (category) {
        if (!mongoose.isValidObjectId(category)) {
            throw new Error("Invalid category id");
        }
        filter.category = category;
    }

    if (brand) filter.brand = new RegExp(`^${brand}$`, "i");
    if (material) filter.material = new RegExp(`^${material}$`, "i");
    if (color) filter.color = new RegExp(`^${color}$`, "i");

    if (minPrice || maxPrice) {
        filter["pricing.sellingPrice"] = {};
        if (minPrice) filter["pricing.sellingPrice"].$gte = Number(minPrice);
        if (maxPrice) filter["pricing.sellingPrice"].$lte = Number(maxPrice);
    }

    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (isNewArrival !== undefined) filter.isNewArrival = isNewArrival === "true";

    // Dynamic attribute filters, e.g. ?attributes[seating_capacity]=3
    // Express parses attributes[x]=y into req.query.attributes = { x: 'y' }
    if (attributes && typeof attributes === "object") {
        for (const [key, value] of Object.entries(attributes)) {
            filter[`attributes.${key}`] = value;
        }
    }

    return filter;
};

export { buildProductQuery };