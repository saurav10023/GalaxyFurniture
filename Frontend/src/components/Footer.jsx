// src/components/Footer.jsx
//
// Slim single-tier footer -- no commerce chrome (shipping/returns/newsletter),
// no social row. Just wayfinding: brand, shop categories, a couple of
// company links, and a copyright line. Same design language as Navbar.jsx
// (font-serif wordmark, font-mono labels, #C9A66B brass accent, brass
// hairline seam), inverted to the darkest surface in the palette so it
// reads as the page's baseline rather than another section.

import { Link } from "react-router-dom";
import logo from "../assets/galaxy-novelty-logo.png";

const CATEGORY_LINKS = [
  { key: "sofas", label: "Sofas" },
  { key: "beds", label: "Beds" },
  { key: "dining", label: "Dining" },
  { key: "decor", label: "Decor" },
];

const COMPANY_LINKS = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/login", label: "Staff login" },
];

const Footer = () => {
  return (
    // NOTE: no top margin here on purpose — a margin sits outside the
    // footer's own background, so it exposes whatever's behind the page
    // (the default white body) as a visible gap between the page content
    // and the footer. Bottom spacing for a page should come from the page
    // itself (e.g. Hero's own pb-* classes), not from the footer reaching
    // upward.
    <footer className="bg-[#1A130E] text-[#F6F1E7]">
      {/* Brass hairline seam — same signature used under the Navbar, so the
          footer reads as the same piece rather than a bolted-on section. */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A66B]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-10 h-10 rounded-full bg-[#F6F1E7] ring-2 ring-[#C9A66B]/50 overflow-hidden flex items-center justify-center shrink-0">
              <img src={logo} alt="Galaxy Furniture" className="w-full h-full object-cover" />
            </span>
            <span className="font-serif text-[16px] font-semibold tracking-[0.02em] leading-none">
              GALAXY <span className="text-[#C9A66B] italic font-normal">Furniture</span>
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {CATEGORY_LINKS.map((c) => (
              <Link
                key={c.key}
                to={`/shop?category=${c.key}`}
                className="text-[13px] text-[#F6F1E7]/55 hover:text-[#C9A66B] transition-colors duration-150"
              >
                {c.label}
              </Link>
            ))}
            <span className="hidden md:inline w-px h-3.5 bg-[#3B2A22]" />
            {COMPANY_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13px] text-[#F6F1E7]/55 hover:text-[#C9A66B] transition-colors duration-150"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6 pt-5 border-t border-[#3B2A22]">
          <p className="text-[11.5px] text-[#F6F1E7]/35 font-mono">
            © {new Date().getFullYear()} Galaxy Furniture. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="text-[11.5px] text-[#F6F1E7]/35 hover:text-[#C9A66B] transition-colors duration-150">
              Privacy
            </Link>
            <Link to="/terms" className="text-[11.5px] text-[#F6F1E7]/35 hover:text-[#C9A66B] transition-colors duration-150">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;