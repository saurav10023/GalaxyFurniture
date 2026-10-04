// src/pages/admin/SellOut.jsx
import { useState } from "react";
import SellOutForm from "../../components/admin/sellout/SellOutForm";
import RecentSalesTable from "../../components/admin/sellout/RecentSalesTable";

export default function SellOut() {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 text-ink">
            <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Sell Out</h1>
                <p className="text-sm text-stone mt-0.5">Record a checkout and see recent activity.</p>
            </div>

            <SellOutForm onSaleCreated={() => setRefreshKey((k) => k + 1)} />

            <RecentSalesTable refreshKey={refreshKey} />
        </div>
    );
}