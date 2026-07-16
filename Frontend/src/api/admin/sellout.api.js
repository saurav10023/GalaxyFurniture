// src/api/admin/sellout.api.js
import API from "../axios";

const BASE = "/api/v1/sales";

// ---- CREATE SALE ----
// Confirmed against sale.controller.js. Body:
// {
//   customerName, customerPhone,        // always both — server upserts
//                                        // the Customer by phone, no
//                                        // separate create-customer call
//   items: [{ product: productId, quantity }],  // integer quantity >= 1
//   amountPaidNow?: number,              // initial payment, same transaction
//   paymentMode?: "cash"|"upi"|"card"|"bank_transfer"|"other",
//   saleDate?: string,                   // ISO date, defaults to now
//   notes?: string
// }
// Server resolves productName/sku/prices from each Product doc, decrements
// stock, and (if amountPaidNow > 0) creates the matching Payment ledger
// entry — all in one transaction. No follow-up call needed.
export const createSale = async (payload) => {
    const { data } = await API.post(BASE, payload);
    return data.data;
};

// params: { customer?, status?, dateFrom?, dateTo?, page?, limit? }
export const getAllSales = async (params = {}) => {
    const { data } = await API.get(BASE, { params });
    return data.data;
};

export const getSaleById = async (id) => {
    const { data } = await API.get(`${BASE}/${id}`);
    return data.data;
};

export const getSalesByCustomer = async (customerId) => {
    const { data } = await API.get(`${BASE}/customer/${customerId}`);
    return data.data;
};

// Backend note (from routes comment): only allowed if no payments have
// been recorded against the sale yet.
export const deleteSale = async (id) => {
    const { data } = await API.delete(`${BASE}/${id}`);
    return data.data;
};