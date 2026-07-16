// models/sale.model.js
import mongoose, { Schema } from "mongoose";

const saleItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        // Snapshots — product name/SKU/prices can change later, but this
        // sale record must always reflect what was actually sold at the time.
        productName: { type: String, required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        purchasePriceAtSale: { type: Number, required: true, min: 0 }, // for profit calc
        sellingPriceAtSale: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const saleSchema = new Schema(
    {
        invoiceNumber: {
            type: String,
            unique: true,
            sparse: true
        },

        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true
        },

        items: {
            type: [saleItemSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message: "A sale must contain at least one item"
            }
        },

        billedAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // Denormalized for fast reads — kept in sync by payment.controller.js
        // whenever a Payment is created/edited/deleted against this sale.
        amountPaid: {
            type: Number,
            default: 0,
            min: 0
        },

        pendingAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: ["paid", "partially_paid", "pending"],
            default: "pending"
        },

        saleDate: {
            type: Date,
            default: Date.now
        },

        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

// // Auto invoice number + status derivation
// saleSchema.pre("save", async function () {
//     if (!this.invoiceNumber) {
//         const Model = mongoose.model("Sale");
//         const count = await Model.countDocuments();
//         this.invoiceNumber = `INV-${String(count + 1).padStart(6, "0")}`;
//     }

//     this.pendingAmount = Math.max(this.billedAmount - this.amountPaid, 0);

//     if (this.amountPaid <= 0) this.status = "pending";
//     else if (this.pendingAmount <= 0) this.status = "paid";
//     else this.status = "partially_paid";
// });

// Auto invoice number + status derivation
saleSchema.pre("save", async function () {
    if (!this.invoiceNumber) {
        // No dedicated counter collection — instead, find the highest
        // existing invoice number and increment it. This narrows the race
        // window a lot versus countDocuments() (which breaks under deletes
        // too), but two concurrent saves can still pick the same number in
        // rare cases. The unique index on invoiceNumber is the real
        // safety net: if that happens, this save throws a duplicate-key
        // error instead of silently succeeding, and the caller can retry.
        const lastSale = await mongoose
            .model("Sale")
            .findOne({ invoiceNumber: { $exists: true } })
            .sort({ invoiceNumber: -1 })
            .select("invoiceNumber")
            .session(this.$session());

        let nextSeq = 1;
        if (lastSale?.invoiceNumber) {
            const lastSeq = parseInt(lastSale.invoiceNumber.replace("INV-", ""), 10);
            if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }

        this.invoiceNumber = `INV-${String(nextSeq).padStart(6, "0")}`;
    }

    this.pendingAmount = Math.max(this.billedAmount - this.amountPaid, 0);

    if (this.amountPaid <= 0) this.status = "pending";
    else if (this.pendingAmount <= 0) this.status = "paid";
    else this.status = "partially_paid";
});

export const Sale = mongoose.model("Sale", saleSchema);