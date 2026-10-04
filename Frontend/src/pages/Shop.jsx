import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Armchair, Search as SearchIcon, X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import API from "../api/axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const PAGE_SIZE = 12;
const SECTION_PREVIEW_SIZE = 6;

// ---- liquid-glass surfaces ----------------------------------------------------
const GLASS =
  "bg-gradient-to-br from-white/75 to-white/30 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(90,70,40,0.07),0_10px_28px_-14px_rgba(80,60,30,0.3)]";
const GLASS_DARK =
  "bg-gradient-to-br from-[#5A6450]/95 to-[#343C2E]/95 backdrop-blur-xl text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_26px_-12px_rgba(52,60,46,0.6)]";
const RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const LIFT = "transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]";

// ---- shared safety helpers ------------------------------------------------
// Same defensive rendering as ProductView.jsx — category/brand can come back
// as a populated object ({ _id, name, fields, slug }) rather than a string,
// and must never be handed to JSX directly.
const displayName = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "number") return String(field);
  return field.name || field.title || field.slug || "";
};

const formatINR = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

// ---- categories ------------------------------------------------------------
function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/categories`);
        if (!res.ok) throw new Error("Failed to load categories");
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (!cancelled) {
          setCategories(list);
          setError(false);
        }
      } catch (err) {
        console.error("Shop: could not load categories", err);
        if (!cancelled) {
          setCategories([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}

// ---- product card -----------------------------------------------------------
const ProductCard = ({ product, className = "" }) => {
  const navigate = useNavigate();
  const inStock = Number(product.stock) > 0;

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product._id}`)}
      className={`group text-left rounded-2xl overflow-hidden ${GLASS} ${LIFT} hover:border-moss/30 ${RING} ${className}`}
    >
      <div className="relative aspect-square bg-gradient-to-br from-white via-[#FBF8F1] to-linen flex items-center justify-center overflow-hidden">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-[80%] h-[80%] object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Armchair className="w-12 h-12 text-clay/70 stroke-[1]" />
        )}
        <span
          className={`absolute top-2.5 left-2.5 text-[10.5px] font-medium rounded-full px-2.5 py-1 ${GLASS} ${
            inStock ? "text-moss" : "text-stone"
          }`}
        >
          {inStock ? "In stock" : "Made to order"}
        </span>
      </div>
      <div className="p-3 sm:p-3.5">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-clay truncate">
          {displayName(product.brand)}
        </p>
        <p className="font-serif text-[14.5px] sm:text-[15.5px] text-ink leading-snug mt-0.5 truncate">
          {product.name}
        </p>
        <p className="text-[14px] font-semibold text-ink mt-1.5">
          {formatINR(product.pricing?.sellingPrice)}
        </p>
      </div>
    </button>
  );
};

const ProductCardSkeleton = () => (
  <div className={`rounded-2xl overflow-hidden ${GLASS}`}>
    <div className="aspect-square bg-linen animate-pulse" />
    <div className="p-3.5 space-y-2">
      <div className="h-2.5 w-16 rounded-full bg-linen animate-pulse" />
      <div className="h-3.5 w-3/4 rounded-full bg-linen animate-pulse" />
      <div className="h-3.5 w-1/3 rounded-full bg-linen animate-pulse" />
    </div>
  </div>
);

// Shared empty / error state
const StateMessage = ({ title, hint }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 sm:py-20">
    <span className={`w-16 h-16 rounded-full flex items-center justify-center ${GLASS}`}>
      <Armchair className="w-8 h-8 text-clay stroke-[1.2]" />
    </span>
    <p className="mt-4 font-serif text-lg text-ink">{title}</p>
    <p className="mt-1.5 text-[13.5px] text-stone">{hint}</p>
  </div>
);

// ---- category browsing section (default /shop view) -------------------------
const CategorySection = ({ category }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchPreview = async () => {
      try {
        const res = await API.get("/api/v1/products/search", {
          params: { category: category._id, limit: SECTION_PREVIEW_SIZE },
        });
        const list = res?.data?.data?.products || [];
        if (!cancelled) setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(`Shop: failed to load preview for ${category.name}`, err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [category._id, category.name]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mb-10 sm:mb-12">
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
        <h2 className="font-serif font-medium text-[1.4rem] sm:text-[1.7rem] text-ink">
          {category.name}
        </h2>
        <Link
          to={`/shop?category=${category.slug}`}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium text-ink px-3.5 py-1.5 ${GLASS} ${LIFT} ${RING}`}
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: SECTION_PREVIEW_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
};

// ---- main component -----------------------------------------------------------
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const categorySlug = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const isFiltering = Boolean(categorySlug || searchQuery);

  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => setSearchInput(searchQuery), [searchQuery]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug]
  );

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!isFiltering) return;
    // A category slug is in the URL but the category list hasn't resolved
    // it to an id yet — wait rather than firing an unfiltered fetch.
    if (categorySlug && categoriesLoading) return;

    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setErrored(false);

      if (categorySlug && !activeCategory) {
        // Slug in the URL doesn't match any known category — show an empty
        // result instead of silently falling back to the whole catalog.
        if (!cancelled) {
          setProducts([]);
          setPagination({ total: 0, pages: 1, page: 1 });
          setLoading(false);
        }
        return;
      }

      try {
        const params = { page, limit: PAGE_SIZE };
        if (searchQuery) params.q = searchQuery;
        if (activeCategory) params.category = activeCategory._id;

        const res = await API.get("/api/v1/products/search", { params });
        const list = res?.data?.data?.products || [];
        const pag = res?.data?.data?.pagination || { total: list.length, pages: 1, page: 1 };
        if (!cancelled) {
          setProducts(Array.isArray(list) ? list : []);
          setPagination(pag);
        }
      } catch (err) {
        console.error("Shop: failed to load products", err);
        if (!cancelled) {
          setProducts([]);
          setErrored(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [isFiltering, categorySlug, activeCategory, categoriesLoading, searchQuery, page]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    if (!("page" in updates)) next.delete("page");
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() || undefined });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateParams({ search: undefined });
  };

  const selectCategory = (slug) => updateParams({ category: slug || undefined, search: undefined });

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // category pill styles
  const pillBase = `shrink-0 px-4 py-2 rounded-full text-[13.5px] font-medium ${LIFT} ${RING}`;
  const pillIdle = `text-ink/80 hover:text-ink ${GLASS}`;
  const pillActive = GLASS_DARK;

  const pageBtn =
    `w-10 h-10 rounded-full flex items-center justify-center text-ink/80 hover:text-moss ${GLASS} ${LIFT} ${RING} ` +
    "disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:text-ink/80";

  return (
    <div className="relative min-h-screen bg-paper overflow-x-clip">
      {/* soft light fields so the glass has something to bend */}
      <div className="pointer-events-none fixed -top-24 right-[-10%] w-[34rem] h-[34rem] rounded-full bg-[#E3D3B8]/70 blur-[110px]" />
      <div className="pointer-events-none fixed top-1/2 left-[-12%] w-[26rem] h-[26rem] rounded-full bg-[#D3D9C5]/70 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[-15%] right-[25%] w-[24rem] h-[24rem] rounded-full bg-[#EBDDC6]/70 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-8 sm:pt-10 pb-16 sm:pb-20">
        {/* header */}
        <div className="mb-5 sm:mb-6">
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-stone">
            <span className="h-px w-8 bg-clay" />
            The showroom
          </p>
          <h1 className="mt-3 font-serif font-medium text-[1.8rem] sm:text-[2.4rem] lg:text-[2.7rem] leading-[1.08] text-ink">
            Browse every piece on the floor
          </h1>
        </div>

        {/* search */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-lg mb-4 sm:mb-5">
          <div className={`flex items-center gap-2.5 rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-moss/40 transition-colors ${GLASS}`}>
            <SearchIcon className="w-[17px] h-[17px] text-stone shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search sofas, beds, decor…"
              className="flex-1 min-w-0 bg-transparent text-[14px] text-ink placeholder:text-stone/70 focus:outline-none py-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-stone hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className={`shrink-0 rounded-full text-[13px] font-medium px-4 py-2 ${GLASS_DARK} ${LIFT}`}
            >
              Search
            </button>
          </div>
        </form>

        {/* category pills: one scrolling row on phones, wrapping row on larger screens */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-7 sm:mb-9 flex items-center gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={`${pillBase} ${!categorySlug ? pillActive : pillIdle}`}
          >
            All pieces
          </button>

          {categoriesLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="shrink-0 h-9 w-20 rounded-full bg-linen animate-pulse" />
            ))}

          {!categoriesLoading &&
            categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={`${pillBase} ${categorySlug === cat.slug ? pillActive : pillIdle}`}
              >
                {cat.name}
              </button>
            ))}

          {!categoriesLoading && categoriesError && (
            <span className="shrink-0 text-[13px] text-[#B5533A] italic px-1">Couldn't load categories</span>
          )}
        </div>

        {/* ---- filtered / search results view ---- */}
        {isFiltering ? (
          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <p className="text-[13.5px] text-stone">
                {searchQuery ? (
                  <>
                    Results for <span className="text-ink font-medium">"{searchQuery}"</span>
                  </>
                ) : activeCategory ? (
                  <>
                    Showing <span className="text-ink font-medium">{activeCategory.name}</span>
                  </>
                ) : (
                  "Showing filtered pieces"
                )}
                {!loading && !errored && <> · {pagination.total} {pagination.total === 1 ? "piece" : "pieces"}</>}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className={`shrink-0 rounded-full text-[12.5px] font-medium text-ink/80 hover:text-moss px-3.5 py-1.5 ${GLASS} ${LIFT} ${RING}`}
              >
                Clear filters
              </button>
            </div>

            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && errored && (
              <StateMessage title="Something went wrong loading the catalog." hint="Try again in a moment." />
            )}

            {!loading && !errored && products.length === 0 && (
              <StateMessage title="Nothing matches that yet." hint="Try a different search or browse by category." />
            )}

            {!loading && !errored && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8 sm:mt-10">
                    <button
                      type="button"
                      onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                      disabled={page <= 1}
                      aria-label="Previous page"
                      className={pageBtn}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className={`rounded-full px-4 py-2 text-[12.5px] text-stone ${GLASS}`}>
                      Page {pagination.page || page} of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateParams({ page: Math.min(pagination.pages, page + 1) })}
                      disabled={page >= pagination.pages}
                      aria-label="Next page"
                      className={pageBtn}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ---- default sectioned browsing view ---- */
          <div>
            {categoriesLoading && (
              <div className="space-y-10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-6 w-32 rounded-full bg-linen animate-pulse mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                      {Array.from({ length: SECTION_PREVIEW_SIZE }).map((_, j) => (
                        <ProductCardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!categoriesLoading && categoriesError && (
              <StateMessage title="Couldn't load the showroom." hint="Check your connection and try again." />
            )}

            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <StateMessage title="No categories yet." hint="Check back once the showroom is stocked." />
            )}

            {!categoriesLoading &&
              !categoriesError &&
              categories.map((cat) => <CategorySection key={cat._id || cat.slug} category={cat} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;