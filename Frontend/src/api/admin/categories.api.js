// src/api/admin/categories.api.js
//
import API from "../axios";

const BASE = "/api/v1/categories";

// ---- CREATE ----
// payload: { name, description?, isFeatured?, fields?: FieldDef[] }
// FieldDef: { name, key, type, required?, options?, validation?, displayOrder? }
export const createCategory = async (payload) => {
    const { data } = await API.post(BASE, payload);
    return data.data; // ApiResponse wraps as { statusCode, data, message }
};

// ---- LIST ----
// params: { includeInactive?: boolean, featuredOnly?: boolean }
// Admin panel should pass includeInactive: true to see deactivated categories too.
export const getAllCategories = async (params = {}) => {
    const { data } = await API.get(BASE, { params });
    return data.data; // array of categories
};

// ---- GET ONE (by id or slug) ----
export const getCategory = async (idOrSlug) => {
    const { data } = await API.get(`${BASE}/${idOrSlug}`);
    return data.data;
};

// ---- UPDATE (name/description/isFeatured/isActive only — NOT fields) ----
export const updateCategory = async (categoryId, payload) => {
    const { data } = await API.patch(`${BASE}/${categoryId}`, payload);
    return data.data;
};

export const activateCategory = async (categoryId) => {
    const { data } = await API.patch(`${BASE}/${categoryId}/activate`);
    return data.data;
};

export const deactivateCategory = async (categoryId) => {
    const { data } = await API.patch(`${BASE}/${categoryId}/deactivate`);
    return data.data;
};

// Hard delete — backend rejects this with 409 if any product still
// references the category. Surface that message to the admin as-is.
export const deleteCategory = async (categoryId) => {
    const { data } = await API.delete(`${BASE}/${categoryId}`);
    return data.data;
};

// ---- DYNAMIC FIELD MANAGEMENT ----
// Only needed for editing fields on an EXISTING category after creation.
// On create, pass `fields` directly in createCategory()'s payload instead.
export const addCategoryField = async (categoryId, field) => {
    const { data } = await API.post(`${BASE}/${categoryId}/fields`, field);
    return data.data;
};

export const updateCategoryField = async (categoryId, fieldKey, field) => {
    const { data } = await API.patch(`${BASE}/${categoryId}/fields/${fieldKey}`, field);
    return data.data;
};

export const removeCategoryField = async (categoryId, fieldKey) => {
    const { data } = await API.delete(`${BASE}/${categoryId}/fields/${fieldKey}`);
    return data.data;
};