import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Armchair, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import API from "../api/axios";

// Furniture-relevant spec chips — mirrors the reference component's
// buildSpecChips shape but swapped for fields a furniture catalog actually
// carries (material / dimensions / color / warranty) instead of phone specs.
//
// dimensions comes back as an object ({length, width, height, unit}), not a
// string, so it's formatted into a display label before being added to the
// chips array — pushing the raw object caused a "Objects are not valid as a
// React child" crash when chips were rendered.
const formatDimensions = (dimensions) => {
  if (!dimensions) return null;
  const { length, width, height, unit } = dimensions;
  const parts = [length, width, height].filter((v) => v !== undefined && v !== null && v !== "");
  if (parts.length === 0) return null;
  return `${parts.join(" × ")}${unit ? ` ${unit}` : ""}`;
};

const buildSpecChips = (p) => {
  const chips = [];
  if (p.material) chips.push(p.material);
  const dimensionsLabel = formatDimensions(p.dimensions);
  if (dimensionsLabel) chips.push(dimensionsLabel);
  if (p.color) chips.push(p.color);
  if (p.warranty) chips.push(p.warranty);
  return chips.slice(0, 3);
};

const Hero = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/v1/products/search?limit=6");
        const list = res?.data?.data?.products || res?.data?.data || [];
        setProducts(Array.isArray(list) ? list.slice(0, 6) : []);
      } catch (err) {
        console.error("Failed to load featured products", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (products.length < 2) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % products.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [products.length]);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setActive(i);
  };
  const prev = () => goTo((active - 1 + products.length) % products.length);
  const next = () => goTo((active + 1) % products.length);

  const current = products[active];
  const currentChips = current ? buildSpecChips(current) : [];

  const handleCardClick = () => {
    if (!current?._id) return;
    navigate(`/product/${current._id}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#241A14] to-[#1A130E]">
      {/* Ambient brass glow — quiet, not the signature move, just atmosphere */}
      <div className="pointer-events-none absolute -top-24 right-[-10%] w-[36rem] h-[36rem] rounded-full bg-[#C9A66B]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-10%] w-[28rem] h-[28rem] rounded-full bg-[#C9A66B]/5 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 md:px-10 pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32 grid md:grid-cols-2 gap-10 sm:gap-12 md:gap-0 items-center">

        {/* Left column — thesis */}
        <div className="relative max-w-xl text-center md:text-left mx-auto md:mx-0 md:pr-14">
          <span className="inline-flex items-center gap-2 font-mono text-[10.5px] sm:text-[11px] tracking-[0.16em] uppercase text-[#C9A66B] bg-white/5 border border-[#C9A66B]/25 rounded-full px-3.5 py-1.5 mb-6">
            <Armchair className="w-3.5 h-3.5" />
            Furniture · Decor · Handbags
          </span>

          <h1 className="font-serif text-[2.25rem] leading-[1.1] sm:text-[2.75rem] sm:leading-[1.08] md:text-[3.5rem] md:leading-[1.05] text-[#F6F1E7] tracking-tight">
            Every room starts
            <br />
            with <span className="italic text-[#C9A66B] font-normal">good joinery.</span>
          </h1>

          <p className="mt-5 sm:mt-6 text-[15.5px] sm:text-[17px] leading-relaxed text-[#F6F1E7]/65 max-w-md mx-auto md:mx-0">
            Real dimensions, real materials, real prices on every sofa,
            bed frame and finishing piece in the showroom — updated the
            moment stock changes, no asterisks.
          </p>

          <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4">
            <a
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#C9A66B] to-[#9C7A45] text-[#241A14] text-[14.5px] sm:text-[15px] font-semibold px-6 sm:px-7 py-3 sm:py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(201,166,107,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241A14]"
            >
              Browse the showroom
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a
              href="/shop?category=sofas"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[#C9A66B]/40 bg-white/5 text-[#F6F1E7] text-[14.5px] sm:text-[15px] font-medium px-6 sm:px-7 py-3 sm:py-3.5 transition-colors duration-200 hover:bg-white/10 hover:border-[#C9A66B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241A14]"
            >
              Shop sofas
            </a>
          </div>

          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 font-mono text-[11.5px] sm:text-[12px] text-[#F6F1E7]/45">
            <span>Solid wood frames</span>
            <span className="w-1 h-1 rounded-full bg-[#C9A66B]/50" />
            <span>Room delivery</span>
            <span className="w-1 h-1 rounded-full bg-[#C9A66B]/50" />
            <span>12-month warranty</span>
          </div>

          {/* Signature: brass joinery seam, vertical on desktop — echoes the
              hairline under the navbar so the header and hero read as one
              continuous piece rather than stacked sections. */}
          <div className="hidden md:block absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-[#C9A66B]/40 to-transparent" />
        </div>

        {/* Right column — showcase panel */}
        <div className="w-full max-w-[420px] mx-auto md:mx-0 md:max-w-none md:pl-14">
          <div className="relative rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#F6F1E7] via-[#FBF8F1] to-white border border-[#C9A66B]/25 overflow-hidden aspect-[5/4] sm:aspect-[16/10] md:aspect-[4/3] shadow-[0_28px_70px_-30px_rgba(0,0,0,0.5)]">
            {/* Corner brackets — a picture-frame / showroom-plaque motif */}
            {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map(
              (pos) => (
                <span
                  key={pos}
                  className={`absolute w-5 h-5 border-[#C9A66B]/50 ${pos} pointer-events-none z-10`}
                />
              )
            )}

            <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-[#C9A66B]/15 blur-3xl" aria-hidden="true" />

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-[#C9A66B]/10 animate-pulse" />
              </div>
            ) : !current ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <Armchair className="w-16 h-16 text-[#C9A66B]/60 stroke-[1]" />
                <p className="mt-4 text-[13px] text-[#6B5B4F]">No pieces to show yet.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCardClick}
                aria-label={`View ${current.name}`}
                className="group absolute inset-0 flex items-center justify-center focus:outline-none"
              >
                {current.images?.[0]?.url ? (
                  <img
                    src={current.images[0].url}
                    alt={current.name}
                    className="w-[72%] max-h-[74%] object-contain drop-shadow-[0_24px_40px_rgba(36,26,20,0.25)] transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="transition-transform duration-500 group-hover:scale-105">
                    <Armchair className="w-20 h-20 text-[#9C7A45] stroke-[1]" />
                  </span>
                )}
              </button>
            )}

            {current && !loading && (
              <span className="absolute top-4 left-4 font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider text-[#9C7A45] bg-white/90 backdrop-blur border border-[#C9A66B]/30 shadow-sm rounded-full px-3 py-1.5">
                {current.stock > 0 ? "In stock" : "Made to order"}
              </span>
            )}

            {products.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous piece"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur border border-[#C9A66B]/30 text-[#6B5B4F] hover:text-[#9C7A45] shadow-sm flex items-center justify-center transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next piece"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur border border-[#C9A66B]/30 text-[#6B5B4F] hover:text-[#9C7A45] shadow-sm flex items-center justify-center transition-colors duration-150"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Info bar */}
          {current && !loading && (
            <button
              type="button"
              onClick={handleCardClick}
              className="group w-full mt-4 flex items-center justify-between gap-4 rounded-2xl bg-[#2E2119] border border-[#3B2A22] shadow-[0_10px_30px_-16px_rgba(0,0,0,0.4)] px-4 sm:px-5 py-3.5 sm:py-4 text-left transition-all duration-200 hover:border-[#C9A66B]/40 hover:-translate-y-0.5"
            >
              <div className="min-w-0">
                <p className="font-serif text-[14.5px] sm:text-[15.5px] text-[#F6F1E7] leading-tight truncate">
                  {current.name}
                </p>
                <p className="text-[11.5px] sm:text-[12px] text-[#F6F1E7]/50 mt-0.5 capitalize truncate">
                  {current.brand}
                  {current.category ? ` · ${current.category}` : ""}
                </p>
                {currentChips.length > 0 && (
                  <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                    {currentChips.map((chip, i) => (
                      <span
                        key={i}
                        className="font-mono text-[9.5px] text-[#F6F1E7]/70 border border-[#3B2A22] rounded-full px-2 py-0.5"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-[9.5px] uppercase tracking-wider text-[#F6F1E7]/40">Showroom price</p>
                <p className="font-mono text-lg sm:text-xl text-[#C9A66B] mt-0.5">
                  ₹{Number(current.pricing?.sellingPrice ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
            </button>
          )}

          {products.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {products.map((p, i) => (
                <button
                  key={p._id || i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show piece ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === active ? "w-5 bg-[#C9A66B]" : "w-1.5 bg-[#3B2A22] hover:bg-[#C9A66B]/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Brass hairline seam — matches the one under the navbar */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A66B]/50 to-transparent" />
    </section>
  );
};

export default Hero;