// routes/payment.routes.js
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";
import {
    recordPayment,
    getPaymentsBySale,
    getPaymentsByCustomer,
    getAllPayments,
    deletePayment
} from "../controllers/payment.controller.js";

const router = Router();

// Every payment route is admin-only.
router.use(verifyjwt, verifyAdmin);

// GET /api/v1/payments?dateFrom=&dateTo=&mode=&page=&limit=  -> ledger view
router.route("/").get(getAllPayments);

// POST /api/v1/payments/sale/:saleId  -> record a payment against a sale
// GET  /api/v1/payments/sale/:saleId  -> all payments for that sale
router
    .route("/sale/:saleId")
    .post(recordPayment)
    .get(getPaymentsBySale);

// GET /api/v1/payments/customer/:customerId -> all payments across a customer's sales
router.route("/customer/:customerId").get(getPaymentsByCustomer);

// DELETE /api/v1/payments/:id  -> correction, reverses Sale + Customer balances
router.route("/:id").delete(deletePayment);

export default router;