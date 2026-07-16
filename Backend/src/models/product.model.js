import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true // supports text search on catalog
        },

        slug: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true
        },

        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true
        },

        brand: {
            type: String,
            trim: true,
            index: true
        },

        sku: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        // --- Common fields explicitly required by spec's "Product Details" ---
        material: {
            type: String,
            trim: true
        },

        color: {
            type: String,
            trim: true
        },

        dimensions: {
            length: { type: Number, min: 0 },
            width: { type: Number, min: 0 },
            height: { type: Number, min: 0 },
            unit: {
                type: String,
                enum: ["cm", "inch"],
                default: "cm"
            }
        },

        // --- Category-specific dynamic fields (Sofa: seating capacity, Handbag: closure type, etc.) ---
        attributes: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {}
        },

        images: {
            type: [
                {
                    url: { type: String, required: true },
                    publicId: { type: String, required: true }
                }
            ],
            validate: {
                validator: (arr) => arr.length <= 5,
                message: "Maximum 5 images allowed."
            }
        },

        pricing: {
            purchasePrice: {
                type: Number,
                required: true,
                min: 0
            },

            sellingPrice: {
                type: Number,
                required: true,
                min: 0,
                index: true
            },

            // Spec: "Show Price / Contact for Price / Starting From Price"
            displayMode: {
                type: String,
                enum: ["show_price", "contact_for_price", "starting_from"],
                default: "show_price"
            },

            negotiation: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                minimumPrice: {
                    type: Number,
                    min: 0
                }
            }
        },

        stock: {
            current: {
                type: Number,
                default: 0,
                min: 0
            },
            lowStockThreshold: {
                type: Number,
                default: 5,
                min: 0
            }
        },

        // Plain text — no dedicated Supplier collection. Kept simple since
        // supplier-level analytics/reporting isn't a priority; if that
        // changes later, this can be migrated to a ref without touching
        // any other product fields.
        supplier: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        // Spec: "When stock reaches zero, admin chooses: show as Out of Stock OR hide completely"
        outOfStockAction: {
            type: String,
            enum: ["show_as_out_of_stock", "hide"],
            default: "show_as_out_of_stock"
        },

        // Admin's manual Activate/Deactivate control (independent of stock)
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        // Homepage: Featured Products / New Arrivals
        isFeatured: {
            type: Boolean,
            default: false
        },

        isNewArrival: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Virtual: what the customer site should actually show, combining
// admin's manual toggle + stock level + their out-of-stock preference
productSchema.virtual("availabilityStatus").get(function () {
    if (!this.isActive) return "hidden";
    if (this.stock.current > 0) return "in_stock";
    return this.outOfStockAction === "hide" ? "hidden" : "out_of_stock";
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });



// Generate Slug + SKU
productSchema.pre("save", async function () {
    if (!this.slug && this.name) {
        const baseSlug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Append a short random suffix instead of check-then-act looping
        // against exists(). The unique index on `slug` is the real guard;
        // if a collision somehow still occurs, the save fails and the
        // caller can retry, rather than two concurrent saves both passing
        // an exists() check for the same candidate before either commits.
        let candidate = baseSlug;
        if (await mongoose.model("Product").exists({ slug: candidate, _id: { $ne: this._id } })) {
            candidate = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
        }
        this.slug = candidate;
    }

    if (!this.sku) {
        this.sku = `SKU-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    }
});    

export const Product = mongoose.model("Product", productSchema);