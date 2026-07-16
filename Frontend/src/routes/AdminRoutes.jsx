// src/routes/AdminRoutes.jsx
import { Routes, Route } from "react-router-dom";
import AdminRouteGuard from "../components/admin/layout/AdminRouteGuard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminHome from "../pages/admin/AdminHome";
import ProductManagement from "../pages/admin/ProductManagement";
import SellOut from "../pages/admin/SellOut";
import Analytics from "../pages/admin/Analytics";
import PaymentsDue from "../pages/admin/PaymentsDue";

// Mount this at /admin/* in your main router, e.g.:
//   <Route path="/admin/*" element={<AdminRoutes />} />
export default function AdminRoutes() {
    return (
        <Routes>
            <Route
                element={
                    <AdminRouteGuard>
                        <AdminDashboard />
                    </AdminRouteGuard>
                }
            >
                <Route index element={<AdminHome />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="sell-out" element={<SellOut />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="payments" element={<PaymentsDue />} />
            </Route>
        </Routes>
    );
}