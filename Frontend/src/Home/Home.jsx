import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, MessageCircle, Phone, Ruler, Tag, Hammer } from "lucide-react";
import API from "../api/axios";
import Hero from "./Hero";
import CategoryGrid from "../components/CategoryGrid";
import ProductCard from "../components/ProductCard";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { SITE, whatsappLink } from "../lib/site";

// ---- liquid-glass surfaces ----------------------------------------------------
const GLASS =
  "bg-gradient-to-br from-white/70 to-white/25 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(90,70,40,0.08),0_10px_28px_-14px_rgba(80,60,30,0.3)]";
const GLASS_DARK =
  "bg-gradient-to-br from-[#5A6450]/95 to-[#343C2E]/95 backdrop-blur-xl text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_30px_-12px_rgba(52,60,46,0.65)]";
const GLASS_ON_MOSS =
  "bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-xl backdrop-saturate-150 text-white border border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_28px_-14px_rgba(0,0,0,0.5)]";
const GLASS_LIGHT_ON_MOSS =
  "bg-gradient-to-br from-white/95 to-white/70 backdrop-blur-xl text-moss border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_12px_28px_-12px_rgba(0,0,0,0.45)]";
const RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRESS = "transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]";

// Shared section padding: compact on phones, balanced on laptops.
const WRAP = "max-w-7xl mx-auto px-4 sm:px-6 md:px-10";
const PAD = "py-10 sm:py-12 lg:py-14";

// ---- helpers ---------------------------------------------------------------
const Reveal = ({ children, className = "" }) => {
  const { ref, revealed } = useScrollReveal({ threshold: 0.08 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: revealed ? 1 : 0, transform: revealed ? "none" : "translateY(18px)" }}
    >
      {children}
    </div>
  );
};

const SectionHead = ({ eyebrow, title, to, linkLabel = "View all" }) => (
  <div className="flex items-end justify-between gap-4 mb-5 sm:mb-7">
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay mb-2">{eyebrow}</p>
      )}
      <h2 className="font-serif font-medium text-ink text-[1.6rem] sm:text-[2.1rem] lg:text-[2.4rem] leading-[1.08]">
        {title}
      </h2>
    </div>
    {to && (
      <Link
        to={to}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full text-[13px] sm:text-[14px] font-medium text-ink px-3.5 sm:px-4 py-2 ${GLASS} ${PRESS} ${RING}`}
      >
        {linkLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

const fetchProducts = async (params) => {
  const res = await API.get("/api/v1/products/search", { params });
  const list = res?.data?.data?.products || res?.data?.data || [];
  return Array.isArray(list) ? list : [];
};

// Fetches a row of products; optionally falls back to another query when the
// first comes back empty (e.g. nothing has been flagged "featured" yet).
const ProductSection = ({ id, eyebrow, title, params, fallbackParams, tone = "paper" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify([params, fallbackParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let list = await fetchProducts(params);
        if (!list.length && fallbackParams) list = await fetchProducts(fallbackParams);
        if (!cancelled) setProducts(list);
      } catch (err) {
        console.error(`Home: failed to load "${title}"`, err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!loading && products.length === 0) return null;

  return (
    <section id={id} className={`scroll-mt-24 ${tone === "linen" ? "bg-[#EFE8DA]" : "bg-paper"}`}>
      <div className={`${WRAP} ${PAD}`}>
        <Reveal>
          <SectionHead eyebrow={eyebrow} title={title} to="/shop" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-6 sm:gap-y-8">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[4/5] rounded-2xl bg-linen animate-pulse" />
                    <div className="mt-3 h-3 w-16 rounded-full bg-linen animate-pulse" />
                    <div className="mt-2 h-5 w-3/4 rounded-full bg-linen animate-pulse" />
                  </div>
                ))
              : products.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ---- static sections ---------------------------------------------------------
const PROMISES = [
  {
    icon: Ruler,
    title: "Real dimensions",
    body: "Every piece lists its true size and materials, so you know it fits before you visit.",
  },
  {
    icon: Hammer,
    title: "Honest joinery",
    body: "Solid wood frames and sturdy construction, built to be lived on for years, not seasons.",
  },
  {
    icon: Tag,
    title: "No asterisks",
    body: "The price you see is the showroom price — updated the moment anything changes.",
  },
];

const Promises = () => (
  <section className="relative overflow-hidden bg-paper border-y border-line">
    {/* soft colour behind the glass cards */}
    <div aria-hidden className="pointer-events-none absolute -left-20 top-0 w-72 h-72 rounded-full bg-[#D3D9C5]/60 blur-[90px]" />
    <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 w-72 h-72 rounded-full bg-[#E3D3B8]/60 blur-[90px]" />
    <div className={`relative ${WRAP} py-8 sm:py-10 lg:py-12 grid gap-3 sm:gap-4 md:grid-cols-3`}>
      {PROMISES.map(({ icon: Icon, title, body }) => (
        <Reveal key={title}>
          <div className={`h-full flex gap-4 rounded-3xl p-4 sm:p-5 ${GLASS}`}>
            <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-moss ${GLASS}`}>
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-[19px] sm:text-[21px] font-semibold text-ink leading-tight">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-stone">{body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

const VisitBand = () => (
  <section className="bg-paper">
    <div className={`${WRAP} ${PAD}`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#5A6450] to-moss text-paper px-5 py-8 sm:px-10 sm:py-11 lg:px-12 grid gap-7 lg:grid-cols-[1.3fr_1fr] items-center">
          <div aria-hidden className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -right-8 -bottom-32 w-72 h-72 rounded-t-full bg-white/10" />

          <div className="relative">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-paper/65 mb-3">
              Visit the showroom
            </p>
            <h2 className="font-serif font-medium text-[1.75rem] sm:text-[2.3rem] lg:text-[2.6rem] leading-[1.08]">
              Sit on it, touch it, <span className="italic">then decide.</span>
            </h2>
            <p className="mt-4 flex items-start gap-2.5 text-[14.5px] leading-relaxed text-paper/80 max-w-md">
              <MapPin className="w-4 h-4 mt-1 shrink-0" />
              <span>{SITE.address.join(", ")}</span>
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row lg:flex-col gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full text-[14.5px] font-medium px-6 py-3 ${GLASS_LIGHT_ON_MOSS} ${PRESS} focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            >
              <MessageCircle className="w-4 h-4" />
              Enquire on WhatsApp
            </a>
            <a
              href={SITE.phoneHref}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full text-[14.5px] font-medium px-6 py-3 ${GLASS_ON_MOSS} ${PRESS} focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            >
              <Phone className="w-4 h-4" />
              {SITE.phone}
            </a>
            <a
              href={SITE.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[13.5px] text-paper/75 underline underline-offset-4 decoration-paper/30 hover:text-paper hover:decoration-paper/70 transition-colors sm:self-center lg:self-auto"
            >
              Get directions
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

const WhatsAppFab = () => (
  <a
    href={whatsappLink()}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
    className={`fixed z-40 bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:bottom-7 sm:right-7 w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 ${GLASS_DARK} ${RING}`}
  >
    <MessageCircle className="w-6 h-6" />
  </a>
);

// ---- page ---------------------------------------------------------------------
export default function Home() {
  return (
    <>
      <Hero />

      <ProductSection
        id="featured"
        eyebrow="Handpicked"
        title="Featured pieces"
        params={{ isFeatured: true, limit: 4, sort: "newest" }}
        fallbackParams={{ limit: 4, sort: "newest" }}
      />

      <section id="categories" className="scroll-mt-24 bg-[#EFE8DA]">
        <div className={`${WRAP} ${PAD}`}>
          <Reveal>
            <SectionHead eyebrow="Browse" title="Shop by category" to="/shop" linkLabel="All pieces" />
            <CategoryGrid />
          </Reveal>
        </div>
      </section>

      <ProductSection
        id="new"
        eyebrow="Just in"
        title="New arrivals"
        params={{ isNewArrival: true, limit: 4, sort: "newest" }}
      />

      <Promises />
      <VisitBand />
      <WhatsAppFab />
    </>
  );
}