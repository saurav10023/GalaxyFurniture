// routes/customer.routes.js
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";
import {
    getAllCustomers,
    getCustomerById,
    updateCustomer
} from "../controllers/customer.controller.js";

const router = Router();

// All customer routes are admin-only — customers themselves never log in.
router.use(verifyjwt, verifyAdmin);

// GET  /api/v1/customers?search=&pendingOnly=&sortBy=&page=&limit=
router.route("/").get(getAllCustomers);

// GET   /api/v1/customers/:id        -> full profile (sales + payments)
// PATCH /api/v1/customers/:id        -> manual name/phone correction
router
    .route("/:id")
    .get(getCustomerById)
    .patch(updateCustomer);

export default router;