// src/components/admin/layout/AdminMenuFab.jsx
// Mobile-only floating "liquid glass" button that opens the admin sidebar.
//
// Placement: top-left, directly under the site Navbar (same row as the admin
// topbar title). It is fixed, so it stays there while the page scrolls.
// Its `top` follows the Navbar as the Navbar shrinks on scroll.
//
// Scroll behaviour:
//   - while scrolling down: dims and tucks up toward the Navbar a little,
//     then returns when scrolling stops or reverses
//
// Rendered through a portal so it stays fixed to the viewport regardless of
// any transformed / filtered ancestor in the layout. z-[55] keeps it under the
// sidebar overlay (z-60) and the sidebar (z-70), so it is covered while the
// sidebar is open.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconMenu } from "../icons/AdminIcons";

const SCROLLED_AT = 24; // px scrolled before the Navbar has started shrinking
const IDLE_MS = 700; // how long after scrolling stops before it fully returns

export default function AdminMenuFab({ onClick = () => {} }) {
    const [ready, setReady] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [tucked, setTucked] = useState(false);
    const lastY = useRef(0);
    const idleTimer = useRef(0);

    // one entrance moment
    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        lastY.current = window.scrollY;
        setScrolled(window.scrollY > SCROLLED_AT);

        const onScroll = () => {
            const y = window.scrollY;
            const goingDown = y > lastY.current;
            const goingUp = y < lastY.current;
            lastY.current = y;

            setScrolled(y > SCROLLED_AT);
            if (goingDown && y > SCROLLED_AT) setTucked(true);
            if (goingUp || y <= SCROLLED_AT) setTucked(false);

            clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(() => setTucked(false), IDLE_MS);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            clearTimeout(idleTimer.current);
        };
    }, []);

    if (typeof document === "undefined") return null;

    const state = !ready
        ? "opacity-0 scale-50 -translate-y-4"
        : tucked
        ? "opacity-60 scale-90 -translate-y-1"
        : "opacity-100 scale-100 translate-y-0";

    return createPortal(
        <button
            type="button"
            onClick={onClick}
            aria-label="Open navigation"
            style={{
                left: "max(16px, env(safe-area-inset-left, 0px))",
                // Navbar bottom edge + a small gap (Navbar is 68px tall at the
                // top of the page and ~57px once it has shrunk)
                top: scrolled ? "68px" : "80px"
            }}
            className={`md:hidden fixed z-[55] isolate overflow-hidden flex items-center justify-center h-14 w-14 rounded-full
                border border-white/70 text-ink
                bg-white/35 backdrop-blur-xl backdrop-saturate-[1.8]
                shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,0.35),inset_0_0_16px_rgba(255,255,255,0.35),0_18px_36px_-14px_rgba(42,37,31,0.5),0_4px_10px_-4px_rgba(42,37,31,0.2)]
                transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
                active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/60
                ${state}`}
        >
            {/* liquid highlights behind the content */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent" />
                <span className="absolute -bottom-5 -left-3 h-12 w-16 rounded-full bg-clay/35 blur-xl" />
                <span className="absolute -top-4 right-0 h-10 w-12 rounded-full bg-moss/20 blur-xl" />
            </span>

            <IconMenu className="h-[22px] w-[22px]" />
        </button>,
        document.body
    );
}