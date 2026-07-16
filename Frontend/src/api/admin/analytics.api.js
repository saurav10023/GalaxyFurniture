// src/api/admin/analytics.api.js
import API from "../axios";

const BASE = "/api/v1/analytics";

// params: { dateFrom?, dateTo? }
// { totalSales, totalRevenue, estimatedProfit, pendingPayments, stockValue }
export const getDashboardOverview = async (params = {}) => {
    const { data } = await API.get(`${BASE}/overview`, { params });
    return data.data;
};

export const getLowStockProducts = async () => {
    const { data } = await API.get(`${BASE}/low-stock`);
    return data.data;
};

export const getOutOfStockProducts = async () => {
    const { data } = await API.get(`${BASE}/out-of-stock`);
    return data.data;
};

// params: { dateFrom?, dateTo?, limit? }
export const getBestSellingProducts = async (params = {}) => {
    const { data } = await API.get(`${BASE}/best-sellers`, { params });
    return data.data;
};

// params: { dateFrom?, dateTo?, limit? }
export const getBestSellingCategories = async (params = {}) => {
    const { data } = await API.get(`${BASE}/best-categories`, { params });
    return data.data;
};

// params: { limit? }
export const getTopCustomers = async (params = {}) => {
    const { data } = await API.get(`${BASE}/top-customers`, { params });
    return data.data;
};

// params: { year? } — omit for all-time monthly buckets
export const getMonthlySales = async (params = {}) => {
    const { data } = await API.get(`${BASE}/monthly-sales`, { params });
    return data.data;
};

// params: { dateFrom, dateTo } — both required by the backend
export const getDateRangeReport = async (params) => {
    const { data } = await API.get(`${BASE}/date-range`, { params });
    return data.data;
};