// routes/offer.routes.js
import { Router } from "express";
import {
    createOffer,
    getAllOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    getApplicableOfferForProduct,
    getOfferAnalytics,
} from "../controllers/offer.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";

const router = Router();

// specific routes FIRST — public-safe, used by the product detail page
router.route("/product/:productId").get(getApplicableOfferForProduct);

// generic admin-only list/create route
router.route("/").get(verifyjwt, verifyAdmin, getAllOffers);
router.route("/").post(verifyjwt, verifyAdmin, createOffer);

// param-based routes LAST
router.route("/:id/analytics").get(verifyjwt, verifyAdmin, getOfferAnalytics);
router.route("/:id/toggle-status").patch(verifyjwt, verifyAdmin, toggleOfferStatus);

router.route("/:id").get(verifyjwt, verifyAdmin, getOfferById);
router.route("/:id").patch(verifyjwt, verifyAdmin, updateOffer);
router.route("/:id").delete(verifyjwt, verifyAdmin, deleteOffer);

export default router;