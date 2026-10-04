// src/pages/admin/AdminHome.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AnalyticsSummaryCards from "../../components/admin/analytics/AnalyticsSummaryCards";
import {
    IconProducts,
    IconSellOut,
    IconAnalytics,
    IconPaymentsDue,
    IconPaymentHistory,
    IconSalesHistory,
    IconChevronRight
} from "../../components/admin/icons/AdminIcons";

// Soft glass surface, kept quiet for admin use
const GLASS =
    "bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_-16px_rgba(80,60,30,0.35)]";

// Muted, earthy tints so each section is recognisable without looking loud
const SECTIONS = [
    {
        to: "/admin/products",
        title: "Products",
        description: "Create products, categories, and browse your catalog.",
        Icon: IconProducts,
        tint: "bg-[#E4E8DA] text-moss group-hover:bg-[#D8DEC9]"
    },
    {
        to: "/admin/sell-out",
        title: "Sell Out",
        description: "Record a checkout and view recent sales.",
        Icon: IconSellOut,
        tint: "bg-[#F0E2C8] text-[#8A6338] group-hover:bg-[#EAD6B3]"
    },
    {
        to: "/admin/analytics",
        title: "Analytics",
        description: "Revenue, profit, and top-performing categories.",
        Icon: IconAnalytics,
        tint: "bg-[#DDE5E1] text-[#3F5A57] group-hover:bg-[#CEDAD5]"
    },
    {
        to: "/admin/payments",
        title: "Payments Due",
        description: "Customers who still owe money on a sale.",
        Icon: IconPaymentsDue,
        tint: "bg-[#F2DDCD] text-[#9A5A33] group-hover:bg-[#EBCDB7]"
    },
    {
        to: "/admin/payments/history",
        title: "Payment History",
        description: "Search and edit every payment ever recorded.",
        Icon: IconPaymentHistory,
        tint: "bg-[#E8E2D6] text-stone group-hover:bg-[#DDD5C5]"
    },
    {
        to: "/admin/sales/history",
        title: "Sales History",
        description: "Search and edit every sale ever recorded.",
        Icon: IconSalesHistory,
        tint: "bg-[#E9E0D3] text-[#6B5A3A] group-hover:bg-[#DFD3C1]"
    }
];

const today = () =>
    new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

export default function AdminHome() {
    const { user } = useAuth();

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-clay">{today()}</span>
                <h1 className="font-serif font-medium text-[1.6rem] sm:text-[2rem] leading-tight text-ink">
                    Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-sm text-stone">Here's a snapshot of your store, all-time.</p>
            </div>

            <AnalyticsSummaryCards />

            <div>
                <div className="flex items-baseline justify-between mb-3">
                    <h2 className="text-sm font-semibold text-ink/80">Jump into a section</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {SECTIONS.map(({ to, title, description, Icon, tint }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`group relative rounded-2xl p-4 sm:p-5 flex items-start gap-4 ${GLASS}
                                transition-all duration-200 hover:-translate-y-0.5 hover:border-moss/30
                                hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_14px_30px_-16px_rgba(75,84,67,0.45)]
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper`}
                        >
                            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${tint}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                                <p className="text-xs text-stone mt-1 leading-relaxed">{description}</p>
                            </div>
                            <IconChevronRight
                                className="h-4 w-4 text-ink/25 shrink-0 mt-1 transition-transform
                                    group-hover:translate-x-0.5 group-hover:text-moss"
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}