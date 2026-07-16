// src/pages/admin/AdminDashboard.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";

export default function AdminDashboard() {
    return (
        <div className="min-h-screen flex bg-slate-50">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopbar />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}