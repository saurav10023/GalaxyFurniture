// routes/category.routes.js
import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    activateCategory,
    deactivateCategory,
    deleteCategory,
    addCategoryField,
    updateCategoryField,
    removeCategoryField
} from "../controllers/category.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";

const router = Router();

// ---- PUBLIC ROUTES (customer catalog) ----
// No auth — customers browsing categories to filter products.
router.route("/").get(getAllCategories);
router.route("/:idOrSlug").get(getCategory);

// ---- ADMIN ONLY ROUTES ----
router.route("/").post(verifyjwt, verifyAdmin, createCategory);

router
    .route("/:categoryId")
    .patch(verifyjwt, verifyAdmin, updateCategory)
    .delete(verifyjwt, verifyAdmin, deleteCategory);

router.route("/:categoryId/activate").patch(verifyjwt, verifyAdmin, activateCategory);
router.route("/:categoryId/deactivate").patch(verifyjwt, verifyAdmin, deactivateCategory);

// Dynamic field management
router.route("/:categoryId/fields").post(verifyjwt, verifyAdmin, addCategoryField);

router
    .route("/:categoryId/fields/:fieldKey")
    .patch(verifyjwt, verifyAdmin, updateCategoryField)
    .delete(verifyjwt, verifyAdmin, removeCategoryField);

export default router;