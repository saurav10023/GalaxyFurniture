// src/api/admin/customers.api.js
import API from "../axios";

const BASE = "/api/v1/customers";

// params: { search?, pendingOnly?, sortBy?, page?, limit? }
export const getAllCustomers = async (params = {}) => {
    const { data } = await API.get(BASE, { params });
    return data.data; // { customers, pagination }
};

// Full profile: customer doc + all their sales + full payment ledger
export const getCustomerById = async (id) => {
    const { data } = await API.get(`${BASE}/${id}`);
    return data.data; // { customer, sales, payments }
};

// Correction only — name/phone. Aggregates (totalSpent etc.) are read-only.
export const updateCustomer = async (id, payload) => {
    const { data } = await API.patch(`${BASE}/${id}`, payload);
    return data.data;
};