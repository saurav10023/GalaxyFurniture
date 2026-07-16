// models/offer.model.js
import mongoose, { Schema } from "mongoose";

/**
 * Offer
 *
 * scopeType decides what the offer applies to:
 *  - "product"  -> targetId points at a Product
 *  - "category" -> targetId points at a Category
 *  - "brand"    -> targetBrand holds a plain string (Product.brand isn't a
 *                  linked collection, so there's nothing to reference)
 *
 * targetModel is kept in sync with scopeType so targetId can use a
 * dynamic ref (refPath) — this is what lets a single field populate
 * either "Product" or "Category" depending on the document.
 *
 * scopeType is treated as immutable after creation (enforced in the
 * controller, not here) — same reasoning as Product.category.
 */

const offerSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Offer name is required"],
            trim: true
        },

        scopeType: {
            type: String,
            enum: {
                values: ["product", "category", "brand"],
                message: "scopeType must be one of: product, category, brand"
            },
            required: true,
            immutable: true
        },

        // Only set when scopeType is "product" or "category"
        targetId: {
            type: Schema.Types.ObjectId,
            refPath: "targetModel",
            default: undefined
        },

        // Mirrors scopeType so targetId knows which collection to populate.
        // "Product" | "Category" | undefined (for brand-scoped offers)
        targetModel: {
            type: String,
            enum: ["Product", "Category"],
            default: undefined
        },

        // Only set when scopeType is "brand"
        targetBrand: {
            type: String,
            trim: true,
            default: undefined
        },

        discountType: {
            type: String,
            enum: {
                values: ["percentage", "flat"],
                message: "discountType must be 'percentage' or 'flat'"
            },
            required: true
        },

        discountValue: {
            type: Number,
            required: true,
            min: [0, "discountValue cannot be negative"],
            validate: {
                validator: function (value) {
                    // `this` is the document being validated. On updates via
                    // findOneAndUpdate this validator is skipped unless
                    // runValidators + context:'query' are set — the
                    // controller re-validates discount values itself before
                    // save(), so this is a defense-in-depth check for
                    // direct Offer.create()/doc.save() usage.
                    if (this.discountType === "percentage") {
                        return value <= 100;
                    }
                    return true;
                },
                message: "Percentage discount cannot exceed 100"
            }
        },

        // Optional short label shown in UI badges, e.g. "Diwali Sale",
        // "Clearance". Not used for logic, purely descriptive.
        tag: {
            type: String,
            trim: true,
            default: undefined
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return !this.startDate || value > this.startDate;
                },
                message: "endDate must be after startDate"
            }
        },

        // Higher priority wins when multiple offers apply to the same
        // product (see getApplicableOfferForProduct). Ties broken by
        // most recently created.
        priority: {
            type: Number,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// ---- Cross-field consistency (belt-and-suspenders alongside the
// controller's validateScopeTarget) ----
offerSchema.pre("validate", function (next) {
    if (this.scopeType === "brand") {
        this.targetId = undefined;
        this.targetModel = undefined;
        if (!this.targetBrand || !this.targetBrand.trim()) {
            return next(new Error("targetBrand is required when scopeType is 'brand'"));
        }
    } else {
        this.targetBrand = undefined;
        this.targetModel = this.scopeType === "product" ? "Product" : "Category";
        if (!this.targetId) {
            return next(new Error(`targetId is required when scopeType is '${this.scopeType}'`));
        }
    }
    next();
});

// ---- Indexes ----

// Powers getAllOffers listing/sorting and the admin filter panel
offerSchema.index({ scopeType: 1, isActive: 1 });
offerSchema.index({ priority: -1, createdAt: -1 });

// Powers getApplicableOfferForProduct's $or lookup across scope types,
// and the runningOnly filter (isActive + date window)
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
offerSchema.index({ scopeType: 1, targetId: 1 });
offerSchema.index({ scopeType: 1, targetBrand: 1 });

export const Offer = mongoose.model("Offer", offerSchema);