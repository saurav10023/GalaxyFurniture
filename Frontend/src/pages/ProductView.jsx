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
    <div className="border-b border-[#3B2A22]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B] rounded-sm"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 font-serif text-[15px] sm:text-[16px] text-[#F6F1E7]">
          <Icon className="w-4 h-4 text-[#C9A66B]" />
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#F6F1E7]/50 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 -mt-1 text-[13.5px] leading-relaxed text-[#F6F1E7]/65">
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
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider rounded-full px-3 py-1.5 border ${
        inStock
          ? "text-[#9C7A45] bg-white/90 border-[#C9A66B]/30"
          : "text-[#F6F1E7]/70 bg-white/5 border-[#3B2A22]"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-[#8FAE7B]" : "bg-[#F6F1E7]/40"}`}
      />
      {inStock ? `${stock} in stock` : "Made to order"}
    </span>
  );
};

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
      <div className="min-h-screen bg-gradient-to-b from-[#241A14] to-[#1A130E] flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C9A66B]/10 animate-pulse" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#241A14] to-[#1A130E] flex flex-col items-center justify-center text-center px-6">
        <Armchair className="w-16 h-16 text-[#C9A66B]/60 stroke-[1]" />
        <p className="mt-4 font-serif text-xl text-[#F6F1E7]">
          We couldn't find that piece.
        </p>
        <p className="mt-1.5 text-[13.5px] text-[#F6F1E7]/50">
          It may have been sold or taken off the floor.
        </p>
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C9A66B] to-[#9C7A45] text-[#241A14] text-[14px] font-semibold px-6 py-3 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Back to the showroom
        </button>
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
    <div className="min-h-screen bg-gradient-to-b from-[#241A14] to-[#1A130E]">
      {/* ambient glow, consistent with Hero */}
      <div className="pointer-events-none fixed -top-24 right-[-10%] w-[36rem] h-[36rem] rounded-full bg-[#C9A66B]/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-10%] w-[28rem] h-[28rem] rounded-full bg-[#C9A66B]/5 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 md:px-10 pt-8 sm:pt-10 pb-20">
        {/* breadcrumb */}
        <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#F6F1E7]/45 mb-8">
          <Link to="/" className="hover:text-[#C9A66B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            to={`/shop?category=${categoryIdOf(product.category)}`}
            className="hover:text-[#C9A66B] transition-colors capitalize"
          >
            {displayName(product.category)}
          </Link>
          <span>/</span>
          <span className="text-[#F6F1E7]/70 truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* ---- gallery ---- */}
          <div>
            <div className="relative rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#F6F1E7] via-[#FBF8F1] to-white border border-[#C9A66B]/25 overflow-hidden aspect-square shadow-[0_28px_70px_-30px_rgba(0,0,0,0.5)]">
              {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map(
                (pos) => (
                  <span
                    key={pos}
                    className={`absolute w-5 h-5 border-[#C9A66B]/50 ${pos} pointer-events-none z-10`}
                  />
                )
              )}

              {images[activeImage]?.url ? (
                <img
                  src={images[activeImage].url}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-8 sm:p-10"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Armchair className="w-20 h-20 text-[#9C7A45] stroke-[1]" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToImage(activeImage - 1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur border border-[#C9A66B]/30 text-[#6B5B4F] hover:text-[#9C7A45] shadow-sm flex items-center justify-center transition-colors duration-150"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToImage(activeImage + 1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur border border-[#C9A66B]/30 text-[#6B5B4F] hover:text-[#9C7A45] shadow-sm flex items-center justify-center transition-colors duration-150"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2.5 mt-4 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.public_id || i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 bg-[#F6F1E7] transition-colors duration-150 ${
                      i === activeImage ? "border-[#C9A66B]" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- info panel ---- */}
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#C9A66B]">
              {displayName(product.brand)}
              {product.category ? ` · ${displayName(product.category)}` : ""}
            </span>

            <h1 className="mt-2 font-serif text-[1.85rem] sm:text-[2.25rem] leading-[1.1] text-[#F6F1E7]">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <StockBadge stock={product.stock} />
              {product.isNewArrival && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A66B] border border-[#C9A66B]/30 rounded-full px-3 py-1.5">
                  New arrival
                </span>
              )}
            </div>

            {/* price */}
            <div className="mt-6 flex items-end gap-3">
              <span className="font-mono text-[28px] sm:text-[32px] text-[#C9A66B]">
                {formatINR(sellingPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="font-mono text-[15px] text-[#F6F1E7]/35 line-through">
                    {formatINR(mrp)}
                  </span>
                  <span className="font-mono text-[11px] text-[#8FAE7B] bg-[#8FAE7B]/10 border border-[#8FAE7B]/30 rounded-full px-2 py-1">
                    {discountPct}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 font-mono text-[11px] text-[#F6F1E7]/40">
              Showroom reference price
            </p>

            {/* spec chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {chips.map((chip) => (
                  <span
                    key={chip.label}
                    className="font-mono text-[10.5px] text-[#F6F1E7]/70 border border-[#3B2A22] rounded-full px-3 py-1.5"
                  >
                    <span className="text-[#F6F1E7]/40 uppercase tracking-wide">{chip.label}: </span>
                    {chip.value}
                  </span>
                ))}
              </div>
            )}

            {/* description */}
            {product.description && (
              <p className="mt-6 text-[14.5px] leading-relaxed text-[#F6F1E7]/65 max-w-lg">
                {safeText(product.description)}
              </p>
            )}

            {/* enquiry CTA — this is a showroom catalog, not a checkout flow */}
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href={`/contact?piece=${encodeURIComponent(product.name)}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C9A66B] to-[#9C7A45] text-[#241A14] text-[14.5px] font-semibold px-7 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(201,166,107,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241A14]"
              >
                <MessageSquare className="w-4 h-4" />
                Enquire about this piece
              </a>

              <a
                href="/shop"
                className="inline-flex items-center justify-center rounded-full border border-[#C9A66B]/40 bg-white/5 text-[#F6F1E7] text-[14.5px] font-medium px-6 py-3.5 transition-colors duration-200 hover:bg-white/10 hover:border-[#C9A66B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241A14]"
              >
                Continue browsing
              </a>
            </div>

            {/* accordions */}
            <div className="mt-9 border-t border-[#3B2A22]">
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
          <div className="mt-20">
            <h2 className="font-serif text-[1.5rem] text-[#F6F1E7] mb-6">
              More from {displayName(product.category)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {related.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => navigate(`/product/${p._id}`)}
                  className="group text-left rounded-2xl bg-[#2E2119] border border-[#3B2A22] overflow-hidden transition-all duration-200 hover:border-[#C9A66B]/40 hover:-translate-y-0.5"
                >
                  <div className="aspect-square bg-gradient-to-br from-[#F6F1E7] via-[#FBF8F1] to-white flex items-center justify-center overflow-hidden">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-[80%] h-[80%] object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Armchair className="w-10 h-10 text-[#9C7A45] stroke-[1]" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-[13px] text-[#F6F1E7] truncate">{p.name}</p>
                    <p className="font-mono text-[12.5px] text-[#C9A66B] mt-1">
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