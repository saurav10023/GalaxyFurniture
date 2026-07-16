// src/api/admin/payments.api.js
import API from "../axios";

const BASE = "/api/v1/payments";

// body: { amount, paidOn?, mode?, note? }
export const recordPayment = async (saleId, payload) => {
    const { data } = await API.post(`${BASE}/sale/${saleId}`, payload);
    return data.data;
};

export const getPaymentsBySale = async (saleId) => {
    const { data } = await API.get(`${BASE}/sale/${saleId}`);
    return data.data;
};

export const getPaymentsByCustomer = async (customerId) => {
    const { data } = await API.get(`${BASE}/customer/${customerId}`);
    return data.data;
};

export const getAllPayments = async (params = {}) => {
    const { data } = await API.get(BASE, { params });
    return data.data; // { payments, pagination }
};

// body: { amount?, paidOn?, mode?, note? }
export const updatePayment = async (paymentId, payload) => {
    const { data } = await API.patch(`${BASE}/${paymentId}`, payload);
    return data.data;
};

export const deletePayment = async (paymentId) => {
    const { data } = await API.delete(`${BASE}/${paymentId}`);
    return data.data;
};