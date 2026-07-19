// src/pages/admin/Analytics.jsx
import { useState } from "react";
import AnalyticsSummaryCards from "../../components/admin/analytics/AnalyticsSummaryCards";
import RevenueChart from "../../components/admin/analytics/RevenueChart";
import TopCategoriesTable from "../../components/admin/analytics/TopCategoriesTable";
import { IconFilterX } from "../../components/admin/icons/AdminIcons";

const fieldClasses =
    "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

export default function Analytics() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const clearRange = () => {
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Analytics</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Sales performance at a glance.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-end gap-2">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) => setDateTo(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            type="button"
                            onClick={clearRange}
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5"
                        >
                            <IconFilterX className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <AnalyticsSummaryCards dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                    <RevenueChart year={dateFrom ? new Date(dateFrom).getFullYear() : undefined} />
                </div>
                <div className="lg:col-span-1">
                    <TopCategoriesTable dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} limit={8} />
                </div>
            </div>
        </div>
    );
}