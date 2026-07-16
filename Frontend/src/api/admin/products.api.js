// src/api/admin/products.api.js
import API from "../axios";

const BASE = "/api/v1/products";

// ---- Build multipart FormData for create/update ----
// pricing / attributes / dimensions / stock must be JSON.stringify'd —
// the controller parses them back out with JSON.parse on the server.
// (createProduct only parses pricing/attributes/dimensions — NOT stock.
//  updateProduct parses all four. See note in ProductCreateForm.jsx.)
const buildProductFormData = (fields, images = []) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;

        if (["pricing", "attributes", "dimensions", "stock"].includes(key)) {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    });

    images.forEach((file) => formData.append("images", file));

    return formData;
};

// ---- CREATE ----
// fields: { name, category, brand?, description?, material?, color?,
//           supplier, outOfStockAction?, isFeatured?, isNewArrival?,
//           pricing: {...}, attributes: {...}, dimensions: {...} }
// NOTE: do not pass `stock` here — createProduct doesn't parse it.
// Call setInitialStock() right after if the admin entered a starting qty.
export const createProduct = async (fields, images = []) => {
    const formData = buildProductFormData(fields, images);
    const { data } = await API.post(BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return data.data;
};

// ---- Set initial stock right after creation (uses the update endpoint,
// which DOES parse `stock` as JSON) ----
export const setInitialStock = async (productId, stock) => {
    const formData = new FormData();
    formData.append("stock", JSON.stringify(stock));
    const { data } = await API.patch(`${BASE}/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return data.data;
};

// ---- UPDATE ----
// Same shape as create, but category is immutable (omit it) and any
// subset of fields can be sent — controller does a fetch-mutate-save merge.
export const updateProduct = async (productId, fields, newImages = []) => {
    const formData = buildProductFormData(fields, newImages);
    const { data } = await API.patch(`${BASE}/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return data.data;
};

// ---- LIST (admin — unfiltered, paginated) ----
export const getAllProducts = async (params = {}) => {
    const { data } = await API.get(BASE, { params }); // { page, limit }
    return data.data; // { products, pagination }
};

// ---- GET ONE (admin — full doc, not sanitized) ----
export const getProductByIdAdmin = async (id) => {
    const { data } = await API.get(`${BASE}/admin/${id}`);
    return data.data;
};

export const deleteProduct = async (id) => {
    const { data } = await API.delete(`${BASE}/${id}`);
    return data.data;
};

export const toggleProductStatus = async (id) => {
    const { data } = await API.patch(`${BASE}/${id}/toggle-status`);
    return data.data;
};

export const addProductImages = async (id, files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const { data } = await API.post(`${BASE}/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return data.data;
};

export const removeProductImage = async (id, publicId) => {
    const { data } = await API.delete(`${BASE}/${id}/images`, { data: { publicId } });
    return data.data;
};

// ---- ADMIN-AWARE SEARCH ----
// Backing controller (search.controller.js) not reviewed yet — params
// below are a best guess (query, category, page, limit). Confirm/adjust
// once that file is shared; CategoryProductsBoard.jsx depends on this.
export const searchProducts = async (params = {}) => {
    const { data } = await API.get(`${BASE}/admin/search`, { params });
    return data.data;
};