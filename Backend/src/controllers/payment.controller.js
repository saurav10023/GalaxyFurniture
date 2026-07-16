// controllers/payment.controller.js
import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";
import { Sale } from "../models/sale.model.js";
import { Customer } from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const VALID_MODES = ["cash", "upi", "card", "bank_transfer", "other"];

// ---- RECORD A PAYMENT AGAINST AN EXISTING SALE ----
// Admin only. Body: { amount, paidOn (optional, defaults to now), mode, note }
// This is the "add payment with date" feature — each call creates a new,
// independent ledger entry rather than overwriting anything.
const recordPayment = asyncHandler(async (req, res) => {
    const { saleId } = req.params;
    const { amount, paidOn, mode, note } = req.body;

    if (!mongoose.isValidObjectId(saleId)) {
        throw new ApiError(400, "Invalid sale id");
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
        throw new ApiError(400, "A positive payment amount is required");
    }

    if (mode && !VALID_MODES.includes(mode)) {
        throw new ApiError(400, `Invalid payment mode. Allowed: ${VALID_MODES.join(", ")}`);
    }

    const resolvedDate = paidOn ? new Date(paidOn) : new Date();
    if (Number.isNaN(resolvedDate.getTime())) {
        throw new ApiError(400, "Invalid paidOn date");
    }

    const session = await mongoose.startSession();

    try {
        let payment;

        await session.withTransaction(async () => {
            const sale = await Sale.findById(saleId).session(session);
            if (!sale) {
                throw new ApiError(404, "Sale not found");
            }

            if (numericAmount > sale.pendingAmount) {
                throw new ApiError(
                    400,
                    `Payment of ${numericAmount} exceeds pending amount of ${sale.pendingAmount}`
                );
            }

            [payment] = await Payment.create(
                [
                    {
                        sale: sale._id,
                        customer: sale.customer,
                        amount: numericAmount,
                        paidOn: resolvedDate,
                        mode: mode || "cash",
                        note,
                        recordedBy: req.user?._id
                    }
                ],
                { session }
            );

            // Recompute sale totals — pre("save") derives pendingAmount/status
            sale.amountPaid += numericAmount;
            await sale.save({ session });

            // Keep customer's running pending balance in sync
            await Customer.findByIdAndUpdate(
                sale.customer,
                { $inc: { pendingBalance: -numericAmount } },
                { session }
            );
        });

        return res
            .status(201)
            .json(new ApiResponse(201, payment, "Payment recorded successfully"));
    } finally {
        session.endSession();
    }
});

// ---- GET ALL PAYMENTS FOR A SALE ----
const getPaymentsBySale = asyncHandler(async (req, res) => {
    const { saleId } = req.params;

    if (!mongoose.isValidObjectId(saleId)) {
        throw new ApiError(400, "Invalid sale id");
    }

    const saleExists = await Sale.exists({ _id: saleId });
    if (!saleExists) {
        throw new ApiError(404, "Sale not found");
    }

    const payments = await Payment.find({ sale: saleId }).sort({ paidOn: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, payments, "Payments fetched successfully"));
});

// ---- GET ALL PAYMENTS FOR A CUSTOMER (across all their sales) ----
const getPaymentsByCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
        throw new ApiError(400, "Invalid customer id");
    }

    const customerExists = await Customer.exists({ _id: customerId });
    if (!customerExists) {
        throw new ApiError(404, "Customer not found");
    }

    const payments = await Payment.find({ customer: customerId })
        .populate("sale", "invoiceNumber billedAmount saleDate")
        .sort({ paidOn: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, payments, "Customer payments fetched successfully"));
});

// ---- GET ALL PAYMENTS (accounting ledger view — date range, mode filter) ----
// Admin only. Powers a "payments received this week" style report.
const getAllPayments = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, mode, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (mode) {
        if (!VALID_MODES.includes(mode)) {
            throw new ApiError(400, `Invalid payment mode. Allowed: ${VALID_MODES.join(", ")}`);
        }
        filter.mode = mode;
    }

    if (dateFrom || dateTo) {
        filter.paidOn = {};
        if (dateFrom) filter.paidOn.$gte = new Date(dateFrom);
        if (dateTo) filter.paidOn.$lte = new Date(dateTo);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate("customer", "name phone")
            .populate("sale", "invoiceNumber")
            .sort({ paidOn: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Payment.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                payments,
                pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
            },
            "Payments fetched successfully"
        )
    );
});

// ---- DELETE A PAYMENT (correction) ----
// Reverses the effect on Sale and Customer. Use for genuine data-entry
// mistakes only — deleting a payment after the fact changes historical
// accounting, so this should be an admin-only, clearly-audited action
// (recordedBy is preserved on the Payment doc for that reason).
const deletePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid payment id");
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const payment = await Payment.findById(id).session(session);
            if (!payment) {
                throw new ApiError(404, "Payment not found");
            }

            const sale = await Sale.findById(payment.sale).session(session);
            if (sale) {
                sale.amountPaid = Math.max(sale.amountPaid - payment.amount, 0);
                await sale.save({ session });

                await Customer.findByIdAndUpdate(
                    payment.customer,
                    { $inc: { pendingBalance: payment.amount } },
                    { session }
                );
            }

            await payment.deleteOne({ session });
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Payment deleted and balances reversed"));
    } finally {
        session.endSession();
    }
});

export {
    recordPayment,
    getPaymentsBySale,
    getPaymentsByCustomer,
    getAllPayments,
    deletePayment
};