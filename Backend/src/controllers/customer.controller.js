// controllers/customer.controller.js
import mongoose from "mongoose";
import { Customer } from "../models/customer.model.js";
import { Sale } from "../models/sale.model.js";
import { Payment } from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const PHONE_REGEX = /^[0-9]{10}$/;

// ---- GET ALL CUSTOMERS (paginated + searchable) ----
// Admin only. Query params:
//   search      -> matches name (partial, case-insensitive) OR phone (partial)
//   pendingOnly -> "true" to only show customers with an outstanding balance
//   sortBy      -> one of: lastPurchaseDate | totalSpent | totalPurchases | createdAt
//                  (defaults to lastPurchaseDate, most recent first)
//   page, limit -> standard pagination
const getAllCustomers = asyncHandler(async (req, res) => {
    const {
        search,
        pendingOnly,
        sortBy = "lastPurchaseDate",
        page = 1,
        limit = 20
    } = req.query;

    const filter = {};

    if (search) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { name: { $regex: escaped, $options: "i" } },
            { phone: { $regex: escaped } }
        ];
    }

    if (pendingOnly === "true") {
        filter.pendingBalance = { $gt: 0 };
    }

    const allowedSortFields = ["lastPurchaseDate", "totalSpent", "totalPurchases", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "lastPurchaseDate";

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
        Customer.find(filter)
            .sort({ [sortField]: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Customer.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                customers,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            },
            "Customers fetched successfully"
        )
    );
});

// ---- GET SINGLE CUSTOMER'S FULL PROFILE ----
// Admin only. Returns the customer doc plus their complete sales history
// (with line items) and full payment ledger, so the admin panel can render
// a customer page from a single request.
const getCustomerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid customer id");
    }

    const customer = await Customer.findById(id);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    const [sales, payments] = await Promise.all([
        Sale.find({ customer: id }).sort({ saleDate: -1 }),
        Payment.find({ customer: id }).populate("sale", "invoiceNumber").sort({ paidOn: -1 })
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { customer, sales, payments },
            "Customer profile fetched successfully"
        )
    );
});

// ---- MANUALLY EDIT CUSTOMER NAME / PHONE ----
// Admin only. For correcting data-entry mistakes (e.g. a typo'd phone
// number at time of sale). Deliberately whitelists only name/phone —
// totalPurchases, totalSpent, pendingBalance, lastPurchaseDate are
// denormalized aggregates owned by sale.controller.js / payment.controller.js
// and must never be edited directly here.
const updateCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid customer id");
    }

    if (name === undefined && phone === undefined) {
        throw new ApiError(400, "Provide at least one of name or phone to update");
    }

    const customer = await Customer.findById(id);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (!trimmedName) {
            throw new ApiError(400, "Name cannot be empty");
        }
        customer.name = trimmedName;
    }

    if (phone !== undefined) {
        const trimmedPhone = String(phone).trim();
        if (!PHONE_REGEX.test(trimmedPhone)) {
            throw new ApiError(400, "Please use a valid 10-digit mobile number");
        }

        if (trimmedPhone !== customer.phone) {
            const existing = await Customer.findOne({
                phone: trimmedPhone,
                _id: { $ne: id }
            });
            if (existing) {
                throw new ApiError(409, "Another customer already has this phone number");
            }
            customer.phone = trimmedPhone;
        }
    }

    await customer.save();

    return res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer updated successfully"));
});

export { getAllCustomers, getCustomerById, updateCustomer };