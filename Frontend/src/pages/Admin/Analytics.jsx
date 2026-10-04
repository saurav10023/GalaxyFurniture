// src/pages/admin/Analytics.jsx
import { useState } from "react";
import AnalyticsSummaryCards from "../../components/admin/analytics/AnalyticsSummaryCards";
import RevenueChart from "../../components/admin/analytics/RevenueChart";
import TopCategoriesTable from "../../components/admin/analytics/TopCategoriesTable";
import { IconFilterX } from "../../components/admin/icons/AdminIcons";

// Soft glass surface, kept quiet for admin use
const GLASS =
    "bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_-16px_rgba(80,60,30,0.35)]";

// 16px on phones stops iOS from zooming in when a date field is tapped
const fieldClasses =
    "w-full rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-[16px] sm:text-sm text-ink " +
    "focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-moss/30 focus:border-moss/50 transition-all duration-200";

export default function Analytics() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const clearRange = () => {
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-7 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif font-medium text-[1.6rem] sm:text-[2rem] leading-tight text-ink">
                        Analytics
                    </h1>
                    <p className="text-sm text-stone mt-0.5">Sales performance at a glance.</p>
                </div>

                <div className={`rounded-2xl p-3 grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-2.5 ${GLASS}`}>
                    <div className="sm:w-40">
                        <label htmlFor="analytics-from" className="block text-xs font-medium text-ink/70 mb-1">
                            From
                        </label>
                        <input
                            id="analytics-from"
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className={fieldClasses}
                        />
                    </div>
                    <div className="sm:w-40">
                        <label htmlFor="analytics-to" className="block text-xs font-medium text-ink/70 mb-1">
                            To
                        </label>
                        <input
                            id="analytics-to"
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
                            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-full text-sm font-medium text-ink/70 hover:text-moss hover:bg-white/70 px-3.5 py-2
                                transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                        >
                            <IconFilterX className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <AnalyticsSummaryCards dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 min-w-0">
                    <RevenueChart year={dateFrom ? new Date(dateFrom).getFullYear() : undefined} />
                </div>
                <div className="lg:col-span-1 min-w-0">
                    <TopCategoriesTable dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} limit={8} />
                </div>
            </div>
        </div>
    );
}