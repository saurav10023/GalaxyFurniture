// controllers/analytics.controller.js
import mongoose from "mongoose";
import { Sale } from "../models/sale.model.js";
import { Product } from "../models/product.model.js";
import { Customer } from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Shared helper: builds a { saleDate: {...} } match stage from optional
// dateFrom/dateTo query params, or returns {} if neither is given.
const buildDateRangeMatch = (dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return {};

    const range = {};
    if (dateFrom) {
        const from = new Date(dateFrom);
        if (Number.isNaN(from.getTime())) throw new ApiError(400, "Invalid dateFrom");
        range.$gte = from;
    }
    if (dateTo) {
        const to = new Date(dateTo);
        if (Number.isNaN(to.getTime())) throw new ApiError(400, "Invalid dateTo");
        range.$lte = to;
    }
    return { saleDate: range };
};

// ---- DASHBOARD OVERVIEW ----
// One call powers the main dashboard cards: Total Sales, Revenue, Pending
// Payments, Estimated Profit, Stock Value. Optional ?dateFrom&dateTo scopes
// sales/revenue/profit to a custom range; Stock Value is always "as of now"
// since it reflects current inventory, not a historical window.
const getDashboardOverview = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    const dateMatch = buildDateRangeMatch(dateFrom, dateTo);

    const [salesSummary, stockSummary] = await Promise.all([
        Sale.aggregate([
            { $match: dateMatch },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    totalSalesCount: { $addToSet: "$_id" },
                    totalRevenue: { $sum: { $multiply: ["$items.sellingPriceAtSale", "$items.quantity"] } },
                    totalProfit: {
                        $sum: {
                            $multiply: [
                                { $subtract: ["$items.sellingPriceAtSale", "$items.purchasePriceAtSale"] },
                                "$items.quantity"
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalSales: { $size: "$totalSalesCount" },
                    totalRevenue: 1,
                    totalProfit: 1
                }
            }
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    stockValue: {
                        $sum: { $multiply: ["$pricing.purchasePrice", "$stock.current"] }
                    }
                }
            }
        ])
    ]);

    // Pending payments is a current balance, not date-scoped — it reflects
    // money owed right now regardless of when the underlying sale happened.
    const pendingResult = await Sale.aggregate([
        { $match: { status: { $in: ["pending", "partially_paid"] } } },
        { $group: { _id: null, totalPending: { $sum: "$pendingAmount" } } }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalSales: salesSummary[0]?.totalSales || 0,
                totalRevenue: salesSummary[0]?.totalRevenue || 0,
                estimatedProfit: salesSummary[0]?.totalProfit || 0,
                pendingPayments: pendingResult[0]?.totalPending || 0,
                stockValue: stockSummary[0]?.stockValue || 0
            },
            "Dashboard overview fetched successfully"
        )
    );
});

// ---- LOW STOCK PRODUCTS ----
const getLowStockProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({
        isActive: true,
        $expr: { $lte: ["$stock.current", "$stock.lowStockThreshold"] },
        "stock.current": { $gt: 0 }
    })
        .select("name sku stock category brand")
        .populate("category", "name")
        .sort({ "stock.current": 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Low stock products fetched successfully"));
});

// ---- OUT OF STOCK PRODUCTS ----
const getOutOfStockProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({
        isActive: true,
        "stock.current": { $lte: 0 }
    })
        .select("name sku stock category brand outOfStockAction")
        .populate("category", "name")
        .sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Out of stock products fetched successfully"));
});

// ---- BEST SELLING PRODUCTS ----
const getBestSellingProducts = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, limit = 10 } = req.query;
    const dateMatch = buildDateRangeMatch(dateFrom, dateTo);

    const results = await Sale.aggregate([
        { $match: dateMatch },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.product",
                productName: { $first: "$items.productName" },
                sku: { $first: "$items.sku" },
                unitsSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.sellingPriceAtSale", "$items.quantity"] } }
            }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: Number(limit) }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, results, "Best selling products fetched successfully"));
});

// ---- BEST SELLING CATEGORIES ----
const getBestSellingCategories = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, limit = 10 } = req.query;
    const dateMatch = buildDateRangeMatch(dateFrom, dateTo);

    const results = await Sale.aggregate([
        { $match: dateMatch },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productDoc"
            }
        },
        { $unwind: "$productDoc" },
        {
            $group: {
                _id: "$productDoc.category",
                unitsSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.sellingPriceAtSale", "$items.quantity"] } }
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "categoryDoc"
            }
        },
        { $unwind: "$categoryDoc" },
        {
            $project: {
                _id: 0,
                categoryId: "$_id",
                categoryName: "$categoryDoc.name",
                unitsSold: 1,
                revenue: 1
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: Number(limit) }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, results, "Best selling categories fetched successfully"));
});

// ---- TOP CUSTOMERS ----
// Reads directly from Customer's denormalized aggregates rather than
// re-aggregating Sales — fast, and consistent with what each customer's
// profile page shows.
const getTopCustomers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const customers = await Customer.find({})
        .select("name phone totalPurchases totalSpent pendingBalance lastPurchaseDate")
        .sort({ totalSpent: -1 })
        .limit(Number(limit));

    return res
        .status(200)
        .json(new ApiResponse(200, customers, "Top customers fetched successfully"));
});

// ---- MONTHLY SALES ----
// Groups by year+month for a trend chart. ?year=2026 optionally scopes to
// one calendar year; omit it to get all-time monthly buckets.
const getMonthlySales = asyncHandler(async (req, res) => {
    const { year } = req.query;

    const match = {};
    if (year) {
        const y = Number(year);
        if (Number.isNaN(y)) throw new ApiError(400, "Invalid year");
        match.saleDate = {
            $gte: new Date(`${y}-01-01T00:00:00.000Z`),
            $lte: new Date(`${y}-12-31T23:59:59.999Z`)
        };
    }

    const results = await Sale.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
            $group: {
                _id: {
                    year: { $year: "$saleDate" },
                    month: { $month: "$saleDate" }
                },
                revenue: { $sum: { $multiply: ["$items.sellingPriceAtSale", "$items.quantity"] } },
                profit: {
                    $sum: {
                        $multiply: [
                            { $subtract: ["$items.sellingPriceAtSale", "$items.purchasePriceAtSale"] },
                            "$items.quantity"
                        ]
                    }
                },
                unitsSold: { $sum: "$items.quantity" }
            }
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                revenue: 1,
                profit: 1,
                unitsSold: 1
            }
        },
        { $sort: { year: 1, month: 1 } }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, results, "Monthly sales fetched successfully"));
});

// ---- CUSTOM DATE RANGE REPORT ----
// Full report combining revenue, profit, units sold, sale count, and
// pending-at-time-of-range within an arbitrary window the admin picks.
const getDateRangeReport = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
        throw new ApiError(400, "dateFrom and dateTo are both required");
    }

    const dateMatch = buildDateRangeMatch(dateFrom, dateTo);

    const [summary] = await Sale.aggregate([
        { $match: dateMatch },
        { $unwind: "$items" },
        {
            $group: {
                _id: null,
                saleIds: { $addToSet: "$_id" },
                revenue: { $sum: { $multiply: ["$items.sellingPriceAtSale", "$items.quantity"] } },
                profit: {
                    $sum: {
                        $multiply: [
                            { $subtract: ["$items.sellingPriceAtSale", "$items.purchasePriceAtSale"] },
                            "$items.quantity"
                        ]
                    }
                },
                unitsSold: { $sum: "$items.quantity" }
            }
        },
        {
            $project: {
                _id: 0,
                totalSales: { $size: "$saleIds" },
                revenue: 1,
                profit: 1,
                unitsSold: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                range: { from: dateFrom, to: dateTo },
                totalSales: summary?.totalSales || 0,
                revenue: summary?.revenue || 0,
                profit: summary?.profit || 0,
                unitsSold: summary?.unitsSold || 0
            },
            "Date range report fetched successfully"
        )
    );
});

export {
    getDashboardOverview,
    getLowStockProducts,
    getOutOfStockProducts,
    getBestSellingProducts,
    getBestSellingCategories,
    getTopCustomers,
    getMonthlySales,
    getDateRangeReport
};