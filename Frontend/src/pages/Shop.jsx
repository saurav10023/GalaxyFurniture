import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Armchair, Search as SearchIcon, X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import API from "../api/axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const PAGE_SIZE = 12;
const SECTION_PREVIEW_SIZE = 6;

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
      className={`group text-left rounded-2xl bg-[#2E2119] border border-[#3B2A22] overflow-hidden transition-all duration-200 hover:border-[#C9A66B]/40 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B] ${className}`}
    >
      <div className="relative aspect-square bg-gradient-to-br from-[#F6F1E7] via-[#FBF8F1] to-white flex items-center justify-center overflow-hidden">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-[78%] h-[78%] object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Armchair className="w-12 h-12 text-[#9C7A45] stroke-[1]" />
        )}
        <span
          className={`absolute top-2.5 left-2.5 font-mono text-[9px] uppercase tracking-wider rounded-full px-2.5 py-1 border ${
            inStock
              ? "text-[#9C7A45] bg-white/90 border-[#C9A66B]/30"
              : "text-[#6B5B4F]/70 bg-white/70 border-black/5"
          }`}
        >
          {inStock ? "In stock" : "Made to order"}
        </span>
      </div>
      <div className="p-3.5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#C9A66B]/80 truncate">
          {displayName(product.brand)}
        </p>
        <p className="font-serif text-[14.5px] text-[#F6F1E7] leading-snug mt-0.5 truncate">
          {product.name}
        </p>
        <p className="font-mono text-[13.5px] text-[#C9A66B] mt-1.5">
          {formatINR(product.pricing?.sellingPrice)}
        </p>
      </div>
    </button>
  );
};

const ProductCardSkeleton = () => (
  <div className="rounded-2xl bg-[#2E2119] border border-[#3B2A22] overflow-hidden">
    <div className="aspect-square bg-white/5 animate-pulse" />
    <div className="p-3.5 space-y-2">
      <div className="h-2.5 w-16 rounded-full bg-white/10 animate-pulse" />
      <div className="h-3.5 w-3/4 rounded-full bg-white/10 animate-pulse" />
      <div className="h-3.5 w-1/3 rounded-full bg-white/10 animate-pulse" />
    </div>
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
    <section className="mb-14">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="font-serif text-[1.4rem] sm:text-[1.6rem] text-[#F6F1E7]">
          {category.name}
        </h2>
        <Link
          to={`/shop?category=${category.slug}`}
          className="shrink-0 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#C9A66B]/80 hover:text-[#C9A66B] transition-colors"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#241A14] to-[#1A130E]">
      <div className="pointer-events-none fixed -top-24 right-[-10%] w-[36rem] h-[36rem] rounded-full bg-[#C9A66B]/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-10%] w-[28rem] h-[28rem] rounded-full bg-[#C9A66B]/5 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 md:px-10 pt-10 sm:pt-12 pb-20">
        {/* header */}
        <div className="mb-8">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#C9A66B]">
            The showroom
          </span>
          <h1 className="mt-2 font-serif text-[1.9rem] sm:text-[2.3rem] text-[#F6F1E7]">
            Browse every piece on the floor
          </h1>
        </div>

        {/* search */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-lg mb-6">
          <div className="flex items-center gap-2.5 bg-black/25 border border-[#C9A66B]/30 rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-[#C9A66B]/60 transition-colors">
            <SearchIcon className="w-[17px] h-[17px] text-[#F6F1E7]/50 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search sofas, beds, decor…"
              className="flex-1 bg-transparent text-[14px] text-[#F6F1E7] placeholder:text-[#F6F1E7]/40 focus:outline-none py-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-[#F6F1E7]/50 hover:text-[#F6F1E7] hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 rounded-full bg-gradient-to-r from-[#C9A66B] to-[#9C7A45] text-[#241A14] text-[13px] font-semibold px-4 py-2 transition-transform duration-150 hover:-translate-y-0.5"
            >
              Search
            </button>
          </div>
        </form>

        {/* category pills */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={`px-4 py-2 rounded-full text-[13.5px] font-medium border transition-colors duration-150 ${
              !categorySlug
                ? "bg-[#C9A66B] text-[#241A14] border-[#C9A66B]"
                : "text-[#F6F1E7]/75 border-[#3B2A22] hover:border-[#C9A66B]/40 hover:text-[#F6F1E7]"
            }`}
          >
            All pieces
          </button>

          {categoriesLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="h-9 w-20 rounded-full bg-white/5 animate-pulse" />
            ))}

          {!categoriesLoading &&
            categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-[13.5px] font-medium border transition-colors duration-150 ${
                  categorySlug === cat.slug
                    ? "bg-[#C9A66B] text-[#241A14] border-[#C9A66B]"
                    : "text-[#F6F1E7]/75 border-[#3B2A22] hover:border-[#C9A66B]/40 hover:text-[#F6F1E7]"
                }`}
              >
                {cat.name}
              </button>
            ))}

          {!categoriesLoading && categoriesError && (
            <span className="text-[13px] text-[#E27D64] italic px-1">Couldn't load categories</span>
          )}
        </div>

        {/* ---- filtered / search results view ---- */}
        {isFiltering ? (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-[13.5px] text-[#F6F1E7]/55">
                {searchQuery ? (
                  <>
                    Results for <span className="text-[#F6F1E7]">"{searchQuery}"</span>
                  </>
                ) : activeCategory ? (
                  <>
                    Showing <span className="text-[#F6F1E7]">{activeCategory.name}</span>
                  </>
                ) : (
                  "Showing filtered pieces"
                )}
                {!loading && !errored && <> · {pagination.total} {pagination.total === 1 ? "piece" : "pieces"}</>}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-[#F6F1E7]/45 hover:text-[#C9A66B] transition-colors"
              >
                Clear filters
              </button>
            </div>

            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && errored && (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <Armchair className="w-14 h-14 text-[#C9A66B]/50 stroke-[1]" />
                <p className="mt-4 font-serif text-lg text-[#F6F1E7]">Something went wrong loading the catalog.</p>
                <p className="mt-1.5 text-[13.5px] text-[#F6F1E7]/50">Try again in a moment.</p>
              </div>
            )}

            {!loading && !errored && products.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <Armchair className="w-14 h-14 text-[#C9A66B]/50 stroke-[1]" />
                <p className="mt-4 font-serif text-lg text-[#F6F1E7]">Nothing matches that yet.</p>
                <p className="mt-1.5 text-[13.5px] text-[#F6F1E7]/50">Try a different search or browse by category.</p>
              </div>
            )}

            {!loading && !errored && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                      type="button"
                      onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                      disabled={page <= 1}
                      aria-label="Previous page"
                      className="w-10 h-10 rounded-full border border-[#3B2A22] flex items-center justify-center text-[#F6F1E7]/70 hover:text-[#C9A66B] hover:border-[#C9A66B]/40 disabled:opacity-30 disabled:hover:text-[#F6F1E7]/70 disabled:hover:border-[#3B2A22] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[12.5px] text-[#F6F1E7]/60">
                      Page {pagination.page || page} of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateParams({ page: Math.min(pagination.pages, page + 1) })}
                      disabled={page >= pagination.pages}
                      aria-label="Next page"
                      className="w-10 h-10 rounded-full border border-[#3B2A22] flex items-center justify-center text-[#F6F1E7]/70 hover:text-[#C9A66B] hover:border-[#C9A66B]/40 disabled:opacity-30 disabled:hover:text-[#F6F1E7]/70 disabled:hover:border-[#3B2A22] transition-colors"
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
              <div className="space-y-14">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-6 w-32 rounded-full bg-white/10 animate-pulse mb-5" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {Array.from({ length: SECTION_PREVIEW_SIZE }).map((_, j) => (
                        <ProductCardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!categoriesLoading && categoriesError && (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <Armchair className="w-14 h-14 text-[#C9A66B]/50 stroke-[1]" />
                <p className="mt-4 font-serif text-lg text-[#F6F1E7]">Couldn't load the showroom.</p>
                <p className="mt-1.5 text-[13.5px] text-[#F6F1E7]/50">Check your connection and try again.</p>
              </div>
            )}

            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <Armchair className="w-14 h-14 text-[#C9A66B]/50 stroke-[1]" />
                <p className="mt-4 font-serif text-lg text-[#F6F1E7]">No categories yet.</p>
                <p className="mt-1.5 text-[13.5px] text-[#F6F1E7]/50">Check back once the showroom is stocked.</p>
              </div>
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