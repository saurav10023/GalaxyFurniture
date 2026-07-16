// src/pages/admin/Analytics.jsx
import { useState } from "react";
import AnalyticsSummaryCards from "../../components/admin/analytics/AnalyticsSummaryCards";
import RevenueChart from "../../components/admin/analytics/RevenueChart";
import TopCategoriesTable from "../../components/admin/analytics/TopCategoriesTable";

export default function Analytics() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const clearRange = () => {
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Sales performance at a glance.</p>
                </div>

                <div className="flex items-end gap-2">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            type="button"
                            onClick={clearRange}
                            className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <AnalyticsSummaryCards dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />

            <RevenueChart year={dateFrom ? new Date(dateFrom).getFullYear() : undefined} />

            <TopCategoriesTable dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} limit={10} />
        </div>
    );
}