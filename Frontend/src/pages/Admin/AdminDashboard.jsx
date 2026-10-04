// src/pages/admin/AdminDashboard.jsx
//
// Layout strategy: the DOCUMENT scrolls (no fixed-height shell, no nested scroll
// container). Sidebar and topbar are sticky, so only the page content moves.
// This can't clip the bottom of the page the way a fixed-height + overflow-hidden
// shell can when an ancestor (#root, body, a route wrapper) adds its own size.
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminTopbar from "../../components/admin/layout/AdminTopbar";

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="relative min-h-[100dvh] bg-paper text-ink">
            {/* Quiet background: two soft tints, no motion. Keeps the admin calm. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 right-[-8%] w-[34rem] h-[34rem] rounded-full bg-[#E3D3B8]/55 blur-[110px]" />
                <div className="absolute bottom-[-12%] left-[18%] w-[30rem] h-[30rem] rounded-full bg-[#D3D9C5]/55 blur-[110px]" />
            </div>

            {/* Keyboard users can jump past the sidebar */}
            <a
                href="#admin-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-moss focus:text-paper focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
            >
                Skip to content
            </a>

            <div className="relative flex min-h-[100dvh]">
                <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="flex min-w-0 flex-1 flex-col">
                    <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
                    <main
                        id="admin-main"
                        tabIndex={-1}
                        className="flex-1 focus:outline-none pb-[max(2rem,env(safe-area-inset-bottom))]"
                    >
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}