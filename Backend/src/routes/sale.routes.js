// routes/sale.routes.js
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";
import {
    createSale,
    getAllSales,
    getSaleById,
    getSalesByCustomer,
    deleteSale
} from "../controllers/sale.controller.js";

const router = Router();

// Every sale route is admin-only — there's no customer-facing sale flow.
router.use(verifyjwt, verifyAdmin);

// POST /api/v1/sales                  -> record a new sale (transaction)
// GET  /api/v1/sales?customer=&status=&dateFrom=&dateTo=&page=&limit=
router.route("/").post(createSale).get(getAllSales);

// GET /api/v1/sales/customer/:customerId  -> all sales for one customer
router.route("/customer/:customerId").get(getSalesByCustomer);

// GET    /api/v1/sales/:id  -> single sale + its full payment history
// DELETE /api/v1/sales/:id  -> only allowed if no payments recorded yet
router
    .route("/:id")
    .get(getSaleById)
    .delete(deleteSale);

export default router;