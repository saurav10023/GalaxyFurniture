// models/customer.model.js
import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: [/^[0-9]{10}$/, "Please use a valid mobile number"]
        },

        // All fields below are denormalized aggregates, maintained by
        // sale.controller.js and payment.controller.js on every write —
        // never edited directly by an admin.
        totalPurchases: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        pendingBalance: {
            type: Number,
            default: 0
        },
        lastPurchaseDate: {
            type: Date
        }
    },
    { timestamps: true }
);

export const Customer = mongoose.model("Customer", customerSchema);