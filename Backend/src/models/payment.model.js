// models/payment.model.js
import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
    {
        sale: {
            type: Schema.Types.ObjectId,
            ref: "Sale",
            required: true,
            index: true
        },

        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        // Explicit date field — lets the admin backdate a payment for
        // accounting accuracy (e.g. entering a payment a day late).
        paidOn: {
            type: Date,
            required: true,
            default: Date.now
        },

        mode: {
            type: String,
            enum: ["cash", "upi", "card", "bank_transfer", "other"],
            default: "cash"
        },

        note: {
            type: String,
            trim: true
        },

        recordedBy: {
            type: Schema.Types.ObjectId,
            ref: "Admin"
        }
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);