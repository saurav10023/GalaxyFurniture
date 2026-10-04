import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Armchair,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  Ruler,
  ShieldCheck,
  Truck,
} from "lucide-react";
import API from "../api/axios";

// ---- liquid-glass surfaces ----------------------------------------------------
const GLASS =
  "bg-gradient-to-br from-white/75 to-white/30 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(90,70,40,0.07),0_10px_28px_-14px_rgba(80,60,30,0.3)]";
const GLASS_DARK =
  "bg-gradient-to-br from-[#5A6450]/95 to-[#343C2E]/95 backdrop-blur-xl text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_30px_-12px_rgba(52,60,46,0.65)]";
const RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const LIFT = "transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]";
const SHEEN =
  "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full";

// ---- helpers ------------------------------------------------------------
// Same shape as Hero's buildSpecChips, but here we don't slice to 3 —
// the detail page has room to show everything the catalog gave us.
const formatDimensions = (dimensions) => {
  if (!dimensions) return null;
  const { length, width, height, unit } = dimensions;
  const parts = [length, width, height].filter(
    (v) => v !== undefined && v !== null && v !== ""
  );
  if (parts.length === 0) return null;
  return `${parts.join(" × ")}${unit ? ` ${unit}` : ""}`;
};

// Any reference-style field (category, brand, supplier, etc.) can come back
// either as a plain string or as a populated object, e.g.
// { _id, name, fields, slug }. NEVER render that object directly — always
// pull a safe string out of it first. displayName() is for showing it,
// safeText() is a last-resort catch-all for anything unknown (attributes,
// custom fields) so a stray object can never reach JSX as a child.
const displayName = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "number") return String(field);
  return field.name || field.title || field.slug || "";
};

// The search/filter endpoints require the category's Mongo ObjectId, not a
// slug or display name — buildProductQuery does mongoose.isValidObjectId()
// on it and 400s otherwise. When category comes back populated
// ({ _id, name, fields, slug }), pull _id specifically for API calls.
const categoryIdOf = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field; // already an id
  return field._id || "";
};

const safeText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    // Populated ref shape, or any nested object — never hand the object
    // itself to JSX. Fall back to a readable label if one exists.
    if (Array.isArray(value)) return value.map(safeText).join(", ");
    return value.name || value.title || value.slug || value.value || "";
  }
  return String(value);
};

const buildSpecChips = (p) => {
  const chips = [];
  if (p.material) chips.push({ label: "Material", value: safeText(p.material) });
  const dimensionsLabel = formatDimensions(p.dimensions);
  if (dimensionsLabel) chips.push({ label: "Dimensions", value: dimensionsLabel });
  if (p.color) chips.push({ label: "Color", value: safeText(p.color) });
  if (p.warranty) chips.push({ label: "Warranty", value: safeText(p.warranty) });
  return chips;
};

const formatINR = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

// ---- small building blocks -----------------------------------------------

const AccordionRow = ({ icon: Icon, title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-moss"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 font-serif text-[15px] sm:text-[16px] text-ink">
          <Icon className="w-4 h-4 text-clay" />
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 -mt-1 text-[13.5px] leading-relaxed text-stone">
          {children}
        </div>
      )}
    </div>
  );
};

const StockBadge = ({ stock }) => {
  const inStock = Number(stock) > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3 py-1.5 ${GLASS} ${
        inStock ? "text-moss" : "text-stone"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-[#7FA06A]" : "bg-stone/50"}`}
      />
      {inStock ? `${stock} in stock` : "Made to order"}
    </span>
  );
};

// Shared page shell (background + soft light fields)
const Backdrop = () => (
  <>
    <div className="pointer-events-none fixed -top-24 right-[-10%] w-[34rem] h-[34rem] rounded-full bg-[#E3D3B8]/70 blur-[110px]" />
    <div className="pointer-events-none fixed top-1/2 left-[-12%] w-[26rem] h-[26rem] rounded-full bg-[#D3D9C5]/70 blur-[100px]" />
    <div className="pointer-events-none fixed bottom-[-15%] right-[25%] w-[24rem] h-[24rem] rounded-full bg-[#EBDDC6]/70 blur-[100px]" />
  </>
);

// ---- main component -------------------------------------------------------

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      setActiveImage(0);
      try {
        const res = await API.get(`/api/v1/products/${id}`);
        const data = res?.data?.data?.product || res?.data?.data || null;
        if (!cancelled) setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch a few related pieces from the same category once we know it.
  useEffect(() => {
    const categoryId = categoryIdOf(product?.category);
    if (!categoryId) return;
    let cancelled = false;

    const fetchRelated = async () => {
      try {
        const res = await API.get("/api/v1/products/search", {
          params: { category: categoryId, limit: 5 },
        });
        const list = res?.data?.data?.products || res?.data?.data || [];
        const filtered = (Array.isArray(list) ? list : []).filter(
          (p) => p._id !== product._id
        );
        if (!cancelled) setRelated(filtered.slice(0, 4));
      } catch (err) {
        console.error("Failed to load related pieces", err);
        if (!cancelled) setRelated([]);
      }
    };

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [product?.category, product?._id]);

  if (loading) {
    return (
      <div className="relative min-h-[100svh] bg-paper flex items-center justify-center overflow-hidden">
        <Backdrop />
        <div className={`relative w-16 h-16 rounded-2xl animate-pulse ${GLASS}`} />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="relative min-h-[100svh] bg-paper flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <Backdrop />
        <div className="relative flex flex-col items-center">
          <span className={`w-20 h-20 rounded-full flex items-center justify-center ${GLASS}`}>
            <Armchair className="w-10 h-10 text-clay stroke-[1.2]" />
          </span>
          <p className="mt-5 font-serif text-xl text-ink">We couldn't find that piece.</p>
          <p className="mt-1.5 text-[13.5px] text-stone">
            It may have been sold or taken off the floor.
          </p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className={`group relative overflow-hidden mt-6 inline-flex items-center justify-center gap-1.5 rounded-full text-[14.5px] font-medium px-6 py-3 ${GLASS_DARK} ${LIFT} ${RING}`}
          >
            <span className={SHEEN} />
            <span className="relative">Back to the showroom</span>
          </button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const chips = buildSpecChips(product);
  const inStock = Number(product.stock) > 0;

  const sellingPrice = product.pricing?.sellingPrice ?? 0;
  const mrp = product.pricing?.mrp;
  const hasDiscount = mrp && Number(mrp) > Number(sellingPrice);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(sellingPrice) / Number(mrp)) * 100)
    : 0;

  const goToImage = (i) => setActiveImage((i + images.length) % images.length);

  return (
    <div className="relative min-h-[100svh] bg-paper overflow-x-clip">
      <Backdrop />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* breadcrumb: single scrolling line on narrow screens */}
        <nav
          aria-label="Breadcrumb"
          className={`mb-5 sm:mb-7 inline-flex max-w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] text-stone [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${GLASS}`}
        >
          <Link to="/" className="hover:text-moss transition-colors">
            Home
          </Link>
          <span className="text-stone/50">/</span>
          <Link
            to={`/shop?category=${categoryIdOf(product.category)}`}
            className="hover:text-moss transition-colors capitalize"
          >
            {displayName(product.category)}
          </Link>
          <span className="text-stone/50">/</span>
          <span className="text-ink font-medium truncate max-w-[40vw] sm:max-w-[260px]">
            {product.name}
          </span>
        </nav>

        <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-14 items-start">
          {/* ---- gallery (stays in view on tablets and laptops while the details scroll) ---- */}
          <div className="md:sticky md:top-20">
            <div
              className={`relative rounded-[24px] sm:rounded-[28px] overflow-hidden aspect-square max-h-[78svh] w-full mx-auto bg-gradient-to-br from-white via-[#FBF8F1] to-linen border border-white/70 shadow-[0_30px_60px_-30px_rgba(80,60,30,0.45)]`}
            >
              <div aria-hidden className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/70 blur-3xl" />

              {images[activeImage]?.url ? (
                <img
                  src={images[activeImage].url}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-6 sm:p-9 mix-blend-multiply"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Armchair className="w-20 h-20 text-clay/70 stroke-[1]" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToImage(activeImage - 1)}
                    aria-label="Previous image"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full text-ink/80 hover:text-ink hover:scale-105 flex items-center justify-center transition-transform ${GLASS} ${RING}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToImage(activeImage + 1)}
                    aria-label="Next image"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full text-ink/80 hover:text-ink hover:scale-105 flex items-center justify-center transition-transform ${GLASS} ${RING}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2.5 mt-3 sm:mt-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((img, i) => (
                  <button
                    key={img.public_id || i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/80 border-2 transition-all duration-150 ${RING} ${
                      i === activeImage
                        ? "border-moss shadow-md"
                        : "border-white/70 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-contain p-1.5 mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- info panel ---- */}
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
              {displayName(product.brand)}
              {product.category ? ` · ${displayName(product.category)}` : ""}
            </p>

            <h1 className="mt-2 font-serif font-medium text-[1.8rem] sm:text-[2.2rem] lg:text-[2.6rem] leading-[1.08] text-ink break-words">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <StockBadge stock={product.stock} />
              {product.isNewArrival && (
                <span className={`text-[12px] font-medium text-[#8A6338] rounded-full px-3 py-1.5 ${GLASS}`}>
                  New arrival
                </span>
              )}
            </div>

            {/* price */}
            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-serif text-[2rem] sm:text-[2.4rem] leading-none text-ink">
                {formatINR(sellingPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-[15px] text-stone/70 line-through">
                    {formatINR(mrp)}
                  </span>
                  <span className="text-[12px] font-medium text-[#4F7A3F] bg-[#7FA06A]/15 border border-[#7FA06A]/40 rounded-full px-2.5 py-1">
                    {discountPct}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-stone">Showroom reference price</p>

            {/* spec chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {chips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`text-[12px] text-ink rounded-full px-3 py-1.5 ${GLASS}`}
                  >
                    <span className="text-stone">{chip.label}: </span>
                    {chip.value}
                  </span>
                ))}
              </div>
            )}

            {/* description */}
            {product.description && (
              <p className="mt-5 text-[14.5px] leading-relaxed text-stone max-w-lg">
                {safeText(product.description)}
              </p>
            )}

            {/* enquiry CTA — this is a showroom catalog, not a checkout flow */}
            <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
              <a
                href={`/contact?piece=${encodeURIComponent(product.name)}`}
                className={`group relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full text-[14.5px] font-medium px-7 py-3.5 ${GLASS_DARK} ${LIFT} ${RING}`}
              >
                <span className={SHEEN} />
                <MessageSquare className="relative w-4 h-4" />
                <span className="relative">Enquire about this piece</span>
              </a>

              <a
                href="/shop"
                className={`group relative overflow-hidden inline-flex items-center justify-center rounded-full text-ink text-[14.5px] font-medium px-6 py-3.5 ${GLASS} ${LIFT} ${RING}`}
              >
                <span className={`${SHEEN} via-white/90`} />
                <span className="relative">Continue browsing</span>
              </a>
            </div>

            {/* accordions */}
            <div className={`mt-6 sm:mt-8 rounded-2xl px-4 sm:px-5 ${GLASS}`}>
              <AccordionRow icon={Ruler} title="Dimensions & materials" defaultOpen>
                <ul className="space-y-1.5">
                  {formatDimensions(product.dimensions) && (
                    <li>Overall size: {formatDimensions(product.dimensions)}</li>
                  )}
                  {product.material && <li>Material: {safeText(product.material)}</li>}
                  {product.color && <li>Color: {safeText(product.color)}</li>}
                  {product.attributes &&
                    Object.entries(product.attributes).map(([k, v]) => (
                      <li key={k} className="capitalize">
                        {k}: {safeText(v)}
                      </li>
                    ))}
                </ul>
              </AccordionRow>

              <AccordionRow icon={ShieldCheck} title="Warranty">
                <p>
                  {product.warranty
                    ? `Covered by a ${safeText(product.warranty)} manufacturer warranty against structural defects.`
                    : "Covered by our standard 12-month warranty against structural defects."}
                </p>
              </AccordionRow>

              <AccordionRow icon={Truck} title="Availability">
                <p>
                  {inStock
                    ? "Currently on the showroom floor — visit in person or enquire for details."
                    : "This piece is made to order. Enquire for current build and availability timelines."}
                </p>
              </AccordionRow>
            </div>
          </div>
        </div>

        {/* ---- related pieces ---- */}
        {related.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="font-serif font-medium text-[1.4rem] sm:text-[1.7rem] text-ink mb-4 sm:mb-5">
              More from {displayName(product.category)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {related.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => navigate(`/product/${p._id}`)}
                  className={`group text-left rounded-2xl overflow-hidden ${GLASS} ${LIFT} hover:border-moss/30 ${RING}`}
                >
                  <div className="aspect-square bg-gradient-to-br from-white via-[#FBF8F1] to-linen flex items-center justify-center overflow-hidden">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-[80%] h-[80%] object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Armchair className="w-10 h-10 text-clay/70 stroke-[1]" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-[14px] text-ink truncate">{p.name}</p>
                    <p className="text-[13.5px] font-semibold text-ink mt-1">
                      {formatINR(p.pricing?.sellingPrice)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductView;