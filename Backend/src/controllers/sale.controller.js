// controllers/sale.controller.js
import mongoose from "mongoose";
import { Sale } from "../models/sale.model.js";
import { Payment } from "../models/payment.model.js";
import { Customer } from "../models/customer.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---- CREATE SALE ----
// Admin only. Body:
// {
//   customerName, customerPhone,
//   items: [{ product: <id>, quantity: <n> }],
//   amountPaidNow: <optional initial payment>,
//   paymentMode: <optional, used only if amountPaidNow > 0>,
//   saleDate: <optional, defaults to now>,
//   notes: <optional>
// }
//
// Runs as a transaction: stock check + decrement, Sale creation, optional
// initial Payment record, and Customer aggregate update all succeed together
// or all roll back. Requires MongoDB running as a replica set (standard for
// Atlas; a local single-node mongod needs --replSet for this to work).
//
// NOTE: no idempotency key yet — a client retry (flaky network, double-tap)
// will currently create a second, independent sale. Flagged as a follow-up;
// not fixed in this pass.
const createSale = asyncHandler(async (req, res) => {
    const {
        customerName,
        customerPhone,
        items,
        amountPaidNow,
        paymentMode,
        saleDate,
        notes
    } = req.body;

    if (!customerName || !customerPhone) {
        throw new ApiError(400, "Customer name and phone are required");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "At least one item is required");
    }

    for (const item of items) {
        if (!item.product || !mongoose.isValidObjectId(item.product)) {
            throw new ApiError(400, "Each item must have a valid product id");
        }
        // Must be a whole number — a fractional quantity (e.g. 1.5) would
        // decrement stock.current by a fraction and produce a non-integer
        // stock count for discrete inventory going forward.
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            throw new ApiError(400, "Each item must have an integer quantity >= 1");
        }
    }

    const initialPayment = Number(amountPaidNow) || 0;
    if (initialPayment < 0) {
        throw new ApiError(400, "amountPaidNow cannot be negative");
    }

    const session = await mongoose.startSession();
    const MAX_RETRIES = 3;

    try {
        let createdSale;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await session.withTransaction(async () => {
                    // 1. Validate stock and build snapshot line items
                    const saleItems = [];
                    let billedAmount = 0;

                    for (const { product: productId, quantity } of items) {
                        const product = await Product.findById(productId).session(session);

                        if (!product) {
                            throw new ApiError(404, `Product ${productId} not found`);
                        }

                        // TODO (issue #6): also reject if !product.isActive —
                        // currently a deactivated/delisted product can still
                        // be sold through this endpoint since only stock is
                        // checked. Left unchanged pending confirmation of
                        // intended behavior.

                        if (product.stock.current < quantity) {
                            throw new ApiError(
                                400,
                                `Insufficient stock for "${product.name}": have ${product.stock.current}, need ${quantity}`
                            );
                        }

                        product.stock.current -= quantity;
                        await product.save({ session });

                        const lineTotal = product.pricing.sellingPrice * quantity;
                        billedAmount += lineTotal;

                        saleItems.push({
                            product: product._id,
                            productName: product.name,
                            sku: product.sku,
                            quantity,
                            purchasePriceAtSale: product.pricing.purchasePrice,
                            sellingPriceAtSale: product.pricing.sellingPrice
                        });
                    }

                    if (initialPayment > billedAmount) {
                        throw new ApiError(400, "Initial payment cannot exceed the billed amount");
                    }

                    // 2. Find or create the customer (identified by phone, no signup flow)
                    let customer = await Customer.findOne({ phone: customerPhone }).session(session);

                    if (!customer) {
                        customer = new Customer({ name: customerName, phone: customerPhone });
                    } else if (customer.name !== customerName) {
                        // Keep the latest name on record without forcing a manual edit step
                        customer.name = customerName;
                    }

                    // 3. Create the sale
                    const resolvedSaleDate = saleDate ? new Date(saleDate) : new Date();

                    const [sale] = await Sale.create(
                        [
                            {
                                customer: customer._id,
                                items: saleItems,
                                billedAmount,
                                amountPaid: initialPayment,
                                saleDate: resolvedSaleDate,
                                notes
                            }
                        ],
                        { session }
                    );

                    // 4. Record the initial payment as its own ledger entry, if any
                    if (initialPayment > 0) {
                        await Payment.create(
                            [
                                {
                                    sale: sale._id,
                                    customer: customer._id,
                                    amount: initialPayment,
                                    paidOn: resolvedSaleDate,
                                    mode: paymentMode || "cash",
                                    note: "Initial payment at time of sale",
                                    recordedBy: req.user?._id
                                }
                            ],
                            { session }
                        );
                    }

                    // 5. Update customer aggregates
                    customer.totalPurchases += 1;
                    customer.totalSpent += billedAmount;
                    customer.pendingBalance += sale.pendingAmount;
                    customer.lastPurchaseDate = resolvedSaleDate;
                    await customer.save({ session });

                    createdSale = sale;
                });

                break; // transaction succeeded — exit retry loop
            } catch (err) {
                // 11000 = MongoDB duplicate key. Only retry on invoiceNumber
                // collisions (a rare race in Sale's pre-save numbering);
                // any other error (bad input, insufficient stock, etc.)
                // should propagate immediately instead of retrying pointlessly.
                const isInvoiceCollision =
                    err.code === 11000 && err.message?.includes("invoiceNumber");

                if (!isInvoiceCollision || attempt === MAX_RETRIES) {
                    throw err;
                }
            }
        }

        const populatedSale = await Sale.findById(createdSale._id).populate(
            "customer",
            "name phone"
        );

        return res
            .status(201)
            .json(new ApiResponse(201, populatedSale, "Sale recorded successfully"));
    } finally {
        session.endSession();
    }
});

// ---- GET ALL SALES ----
// Admin only. Filters: customer (id), status, dateFrom, dateTo.
const getAllSales = asyncHandler(async (req, res) => {
    const { customer, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (customer) {
        if (!mongoose.isValidObjectId(customer)) {
            throw new ApiError(400, "Invalid customer id");
        }
        filter.customer = customer;
    }

    if (status) {
        if (!["paid", "partially_paid", "pending"].includes(status)) {
            throw new ApiError(400, "Invalid status filter");
        }
        filter.status = status;
    }

    if (dateFrom || dateTo) {
        filter.saleDate = {};
        if (dateFrom) filter.saleDate.$gte = new Date(dateFrom);
        if (dateTo) filter.saleDate.$lte = new Date(dateTo);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sales, total] = await Promise.all([
        Sale.find(filter)
            .populate("customer", "name phone")
            .sort({ saleDate: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Sale.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                sales,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            },
            "Sales fetched successfully"
        )
    );
});

// ---- GET SINGLE SALE (with its full payment history) ----
const getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid sale id");
    }

    const sale = await Sale.findById(id).populate("customer", "name phone");
    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    const payments = await Payment.find({ sale: sale._id }).sort({ paidOn: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, { sale, payments }, "Sale fetched successfully"));
});

// ---- GET SALES FOR A SPECIFIC CUSTOMER ----
const getSalesByCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
        throw new ApiError(400, "Invalid customer id");
    }

    const customerExists = await Customer.exists({ _id: customerId });
    if (!customerExists) {
        throw new ApiError(404, "Customer not found");
    }

    const sales = await Sale.find({ customer: customerId }).sort({ saleDate: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, sales, "Customer sales fetched successfully"));
});

// ---- DELETE SALE ----
// Only allowed if no payments have been recorded against it yet — deleting
// a sale with payment history would silently corrupt the accounting trail
// and the customer's aggregates. Use payment corrections / a future
// "cancel sale" workflow (with explicit stock + ledger reversal) instead
// once payments exist.
const deleteSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid sale id");
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const sale = await Sale.findById(id).session(session);
            if (!sale) {
                throw new ApiError(404, "Sale not found");
            }

            const paymentCount = await Payment.countDocuments({ sale: sale._id }).session(session);
            if (paymentCount > 0) {
                throw new ApiError(
                    409,
                    "Cannot delete a sale with recorded payments. This sale already has payment history."
                );
            }

            // Restore stock for each item
            for (const item of sale.items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { "stock.current": item.quantity } },
                    { session }
                );
            }

            // Reverse customer aggregates
            await Customer.findByIdAndUpdate(
                sale.customer,
                {
                    $inc: {
                        totalPurchases: -1,
                        totalSpent: -sale.billedAmount,
                        pendingBalance: -sale.pendingAmount
                    }
                },
                { session }
            );

            await sale.deleteOne({ session });
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Sale deleted successfully"));
    } finally {
        session.endSession();
    }
});

export { createSale, getAllSales, getSaleById, getSalesByCustomer, deleteSale };