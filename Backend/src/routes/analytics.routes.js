// routes/analytics.routes.js
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";
import {
    getDashboardOverview,
    getLowStockProducts,
    getOutOfStockProducts,
    getBestSellingProducts,
    getBestSellingCategories,
    getTopCustomers,
    getMonthlySales,
    getDateRangeReport
} from "../controllers/analytics.controller.js";

const router = Router();

// Every analytics route is admin-only.
router.use(verifyjwt, verifyAdmin);

// GET /api/v1/analytics/overview?dateFrom=&dateTo=
// Dashboard cards: total sales, revenue, pending payments, profit, stock value
router.route("/overview").get(getDashboardOverview);

// GET /api/v1/analytics/low-stock
router.route("/low-stock").get(getLowStockProducts);

// GET /api/v1/analytics/out-of-stock
router.route("/out-of-stock").get(getOutOfStockProducts);

// GET /api/v1/analytics/best-sellers?dateFrom=&dateTo=&limit=
router.route("/best-sellers").get(getBestSellingProducts);

// GET /api/v1/analytics/best-categories?dateFrom=&dateTo=&limit=
router.route("/best-categories").get(getBestSellingCategories);

// GET /api/v1/analytics/top-customers?limit=
router.route("/top-customers").get(getTopCustomers);

// GET /api/v1/analytics/monthly-sales?year=
router.route("/monthly-sales").get(getMonthlySales);

// GET /api/v1/analytics/date-range?dateFrom=&dateTo=  (both required)
router.route("/date-range").get(getDateRangeReport);

export default router;