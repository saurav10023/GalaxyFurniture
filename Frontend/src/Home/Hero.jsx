import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Armchair,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  TreeDeciduous,
} from "lucide-react";
import API from "../api/axios";
import { displayName, firstImage, priceLabel } from "../lib/product";

const SLIDE_MS = 5500;

const TRUST = [
  { icon: TreeDeciduous, label: "Solid wood frames" },
  { icon: Truck, label: "Room delivery" },
  { icon: ShieldCheck, label: "12-month warranty" },
];

// ---- liquid-glass surfaces ----------------------------------------------------
const GLASS =
  "bg-gradient-to-br from-white/70 to-white/25 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(90,70,40,0.08),0_12px_32px_-14px_rgba(80,60,30,0.35)]";
const GLASS_DARK =
  "bg-gradient-to-br from-[#5A6450]/95 to-[#343C2E]/95 backdrop-blur-xl text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_30px_-12px_rgba(52,60,46,0.65)]";
const GLASS_OAK =
  "bg-gradient-to-br from-[#EFD5AB]/95 to-[#D1A671]/95 backdrop-blur-xl text-ink border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_30px_-12px_rgba(166,120,70,0.6)]";
const RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const BTN =
  "group relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full text-[14.5px] font-medium px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]";
const SHEEN =
  "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full";
const RISE = "animate-[riseIn_700ms_cubic-bezier(.2,.7,.2,1)_both]";

const Hero = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get("/api/v1/products/search", { params: { limit: 6 } });
        const list = res?.data?.data?.products || res?.data?.data || [];
        if (!cancelled) setProducts(Array.isArray(list) ? list.slice(0, 6) : []);
      } catch (err) {
        console.error("Failed to load hero products", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // setTimeout keyed on `active` so any manual navigation restarts the timer.
  useEffect(() => {
    if (products.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % products.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active, products.length]);

  const count = products.length;
  const go = (i) => setActive((i + count) % count);
  const current = products[active];
  const img = firstImage(current);
  const price = current ? priceLabel(current) : null;

  return (
    <section className="relative overflow-hidden bg-paper">
      {/* drifting light fields: give the glass something to bend */}
      <div
        aria-hidden
        data-motion=""
        className="pointer-events-none absolute -top-24 -right-16 w-[30rem] h-[30rem] rounded-full bg-[#E3D3B8]/80 blur-[100px] animate-[drift_16s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        data-motion=""
        className="pointer-events-none absolute top-1/2 -left-24 w-[24rem] h-[24rem] rounded-full bg-[#D3D9C5]/80 blur-[90px] animate-[drift_20s_ease-in-out_infinite_reverse]"
      />
      <div
        aria-hidden
        data-motion=""
        className="pointer-events-none absolute -bottom-24 right-1/3 w-[22rem] h-[22rem] rounded-full bg-[#EBDDC6]/80 blur-[90px] animate-[drift_24s_ease-in-out_infinite]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6 pb-10 sm:pt-8 sm:pb-12 lg:py-8 grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-10 items-center">
        {/* ---- thesis ---- */}
        <div className="max-w-xl">
          <p
            data-motion=""
            className={`flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-stone ${RISE}`}
          >
            <span className="h-px w-8 bg-clay" />
            Natural living
          </p>

          <h1
            data-motion=""
            style={{ animationDelay: "100ms" }}
            className={`mt-4 sm:mt-5 font-serif font-medium text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.5rem] xl:text-[4rem] leading-[1.04] tracking-[-0.01em] ${RISE}`}
          >
            Every room starts with <span className="italic text-moss">good joinery.</span>
          </h1>

          <p
            data-motion=""
            style={{ animationDelay: "200ms" }}
            className={`mt-4 sm:mt-5 text-[15px] sm:text-[16px] leading-[1.65] text-stone max-w-md ${RISE}`}
          >
            Real dimensions, real materials, real prices on every sofa, bed frame and finishing
            piece in the showroom — updated the moment stock changes, no asterisks.
          </p>

          <div
            data-motion=""
            style={{ animationDelay: "300ms" }}
            className={`mt-6 sm:mt-7 flex flex-col sm:flex-row sm:items-center gap-3 ${RISE}`}
          >
            <Link to="/shop" className={`${BTN} ${GLASS_DARK} ${RING}`}>
              <span className={SHEEN} />
              <span className="relative">Browse the showroom</span>
              <ArrowUpRight className="relative w-4 h-4" />
            </Link>
            <a href="#categories" className={`${BTN} ${GLASS_OAK} ${RING}`}>
              <span className={`${SHEEN} via-white/60`} />
              <span className="relative">Shop by category</span>
            </a>
          </div>

          {/* small screens: trust chips inline. Large screens: they float around the showcase. */}
          <ul
            data-motion=""
            style={{ animationDelay: "400ms" }}
            className={`lg:hidden mt-6 flex flex-wrap gap-2 ${RISE}`}
          >
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-stone ${GLASS}`}
              >
                <Icon className="w-3.5 h-3.5 text-clay" strokeWidth={1.7} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* ---- showcase ---- */}
        <div
          data-motion=""
          style={{ animationDelay: "150ms" }}
          className={`relative w-full max-w-[600px] mx-auto lg:max-w-none ${RISE}`}
        >
          {/* floating glass chips (desktop) */}
          {TRUST.map(({ icon: Icon, label }, i) => {
            const spots = ["top-5 -left-5", "top-[14%] -right-4", "top-[58%] -left-6"];
            return (
              <span
                key={label}
                data-motion=""
                style={{ animationDelay: `${-i * 1.7}s` }}
                className={`hidden lg:flex absolute z-20 ${spots[i]} items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-medium text-ink animate-[floatY_7s_ease-in-out_infinite] ${GLASS}`}
              >
                <Icon className="w-4 h-4 text-moss" strokeWidth={1.7} />
                {label}
              </span>
            );
          })}

          <div className="relative overflow-hidden rounded-[28px] bg-linen aspect-[5/5.5] sm:aspect-[4/3.8] lg:aspect-auto lg:h-[min(74svh,640px)] shadow-[0_30px_60px_-30px_rgba(80,60,30,0.45)] border border-white/60">
            {/* soft arch + light, a nod to a japandi alcove */}
            <div aria-hidden className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[72%] h-[82%] rounded-t-full bg-[#E1D6C0]" />
            <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/60 blur-3xl" />

            <div className="absolute inset-x-0 top-0 bottom-20 flex items-center justify-center p-2 sm:p-3">
              {loading ? (
                <div className="w-1/2 h-1/2 rounded-3xl bg-ink/5 animate-pulse" />
              ) : !current ? (
                <div className="text-center">
                  <Armchair className="w-14 h-14 mx-auto text-clay/60 stroke-[1]" />
                  <p className="mt-3 text-[14px] text-stone">New pieces arriving soon.</p>
                </div>
              ) : img ? (
                <div data-motion="" className="max-h-full max-w-[94%] flex animate-[floatY_6s_ease-in-out_infinite]">
                  <img
                    key={current._id}
                    src={img}
                    alt={current.name}
                    className="max-h-full w-auto object-contain mix-blend-multiply drop-shadow-[0_26px_30px_rgba(60,45,25,0.28)] animate-[heroFade_600ms_ease-out]"
                  />
                </div>
              ) : (
                <Armchair
                  data-motion=""
                  className="w-20 h-20 text-clay/70 stroke-[1] animate-[floatY_6s_ease-in-out_infinite]"
                />
              )}
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(active - 1)}
                  aria-label="Previous piece"
                  className={`absolute left-3 top-[36%] w-10 h-10 rounded-full text-ink/80 hover:text-ink hover:scale-105 flex items-center justify-center transition-transform ${GLASS} ${RING}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(active + 1)}
                  aria-label="Next piece"
                  className={`absolute right-3 top-[36%] w-10 h-10 rounded-full text-ink/80 hover:text-ink hover:scale-105 flex items-center justify-center transition-transform ${GLASS} ${RING}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {current && !loading && (
              <button
                type="button"
                onClick={() => navigate(`/product/${current._id}`)}
                className={`group absolute left-3 right-3 bottom-3 flex items-center justify-between gap-4 rounded-2xl px-4 sm:px-5 py-3 text-left transition-transform duration-200 hover:-translate-y-0.5 ${GLASS} ${RING}`}
              >
                <div className="min-w-0">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-stone truncate">
                    {displayName(current.category) || displayName(current.brand)}
                  </p>
                  <p className="mt-0.5 font-serif text-[18px] sm:text-[20px] font-semibold leading-tight text-ink truncate">
                    {current.name}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    {price.prefix && (
                      <p className="text-[10.5px] uppercase tracking-wider text-stone">{price.prefix}</p>
                    )}
                    <p className={`text-[15px] ${price.numeric ? "font-semibold text-ink" : "italic text-stone"}`}>
                      {price.text}
                    </p>
                  </div>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-ink transition-colors group-hover:bg-moss group-hover:text-paper ${GLASS}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            )}
          </div>

          {count > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {products.map((p, i) => (
                <button
                  key={p._id || i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show piece ${i + 1}`}
                  aria-current={i === active}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-6 bg-moss" : "w-1.5 bg-ink/20 hover:bg-ink/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes heroFade{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @keyframes riseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-22px)}}
        @media (prefers-reduced-motion: reduce){[data-motion]{animation:none!important}}
      `}</style>
    </section>
  );
};

export default Hero;