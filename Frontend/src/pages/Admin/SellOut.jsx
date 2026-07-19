// src/pages/admin/SellOut.jsx
import { useState } from "react";
import SellOutForm from "../../components/admin/sellout/SellOutForm";
import RecentSalesTable from "../../components/admin/sellout/RecentSalesTable";

export default function SellOut() {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Sell Out</h1>
                <p className="text-sm text-slate-500 mt-0.5">Record a checkout and see recent activity.</p>
            </div>

            <SellOutForm onSaleCreated={() => setRefreshKey((k) => k + 1)} />

            <RecentSalesTable refreshKey={refreshKey} />
        </div>
    );
}