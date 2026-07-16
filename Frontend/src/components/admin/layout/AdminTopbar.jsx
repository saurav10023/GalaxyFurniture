// src/components/admin/layout/AdminTopbar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const PAGE_TITLES = {
    "/admin": "Overview",
    "/admin/products": "Product Management",
    "/admin/sell-out": "Sell Out",
    "/admin/analytics": "Analytics",
    "/admin/payments": "Payments Due",
    "/admin/payments/history": "Payment History" ,
    "/admin/sales/history": "Sales History",
};

export default function AdminTopbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const title = PAGE_TITLES[location.pathname] || "Admin";

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">
            <h1 className="text-sm font-semibold text-slate-900 pl-8 md:pl-0">{title}</h1>

            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-slate-800">{user?.name || "Admin"}</div>
                    <div className="text-xs text-slate-400">{user?.mobileNumber}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                    {(user?.name || "A").charAt(0).toUpperCase()}
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
                >
                    Log out
                </button>
            </div>
        </header>
    );
}