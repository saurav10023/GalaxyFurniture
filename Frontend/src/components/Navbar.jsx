import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/galaxy-novelty-logo.png";

// ---------------------------------------------------------------------------
// Dynamic categories
// ---------------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_URL || "";

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
        // Backend wraps the payload as { data: [...] } (ApiResponse envelope),
        // not { categories: [...] } — unwrap accordingly.
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (!cancelled) {
          setCategories(list);
          setError(false);
        }
      } catch (err) {
        console.error("Navbar: could not load categories", err);
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

// Header gains a solid backdrop + shadow once the page has scrolled past
// this many pixels — reads as "settling" rather than floating.
const SCROLL_THRESHOLD = 12;
const MAX_INLINE_CATEGORIES = 5;

const SearchIcon = ({ className = "w-[18px] h-[18px]" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChevronDown = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DashboardIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const LogoutIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H9"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BrandMark = ({ onClick }) => (
  <Link to="/" onClick={onClick} className="flex items-center gap-3 shrink-0 group">
    <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F6F1E7] ring-2 ring-[#C9A66B]/60 overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:ring-[#C9A66B]">
      <img src={logo} alt="Galaxy Furniture" className="w-full h-full object-cover" />
    </span>
    <span className="font-serif text-[17px] sm:text-[18px] font-semibold text-[#F6F1E7] tracking-[0.02em] leading-none hidden sm:block">
      GALAXY <span className="text-[#C9A66B] italic font-normal">Furniture</span>
    </span>
  </Link>
);

const Avatar = ({ name, size = "w-9 h-9", textSize = "text-[13px]" }) => (
  <span
    className={`${size} rounded-full bg-gradient-to-br from-[#C9A66B] to-[#9C7A45] text-[#241A14] ${textSize} font-semibold flex items-center justify-center uppercase shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]`}
  >
    {name?.charAt(0) || "U"}
  </span>
);

const AccountMenu = ({ user, isStaff, onNavigate, onLogout, variant = "panel" }) => (
  <div className={variant === "panel" ? "py-1.5" : "flex flex-col gap-1"}>
    <div className={variant === "panel" ? "flex items-center gap-3 px-4 py-3" : "flex items-center gap-3 px-1 pb-3"}>
      <Avatar name={user.username} size="w-10 h-10" textSize="text-[14px]" />
      <div className="min-w-0">
        <p className={`text-[14px] font-semibold truncate ${variant === "panel" ? "text-[#14171C]" : "text-[#F6F1E7]"}`}>
          {user.username}
        </p>
        <p className={`text-[11.5px] uppercase tracking-wider ${variant === "panel" ? "text-[#9CA0A6]" : "text-[#F6F1E7]/55"}`}>
          {isStaff ? "Staff account" : "Account"}
        </p>
      </div>
    </div>

    <div className={variant === "panel" ? "h-px bg-[#EDEEE9] mb-1.5" : "h-px bg-[#3B2A22] mb-2"} />

    {isStaff && (
      <Link
        to="/admin"
        onClick={onNavigate}
        className={
          variant === "panel"
            ? "flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#14171C] hover:bg-[#F6F7F3] transition-colors"
            : "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[15px] text-[#F6F1E7] hover:bg-white/10 transition-colors"
        }
      >
        <DashboardIcon />
        Admin Dashboard
      </Link>
    )}

    <button
      onClick={onLogout}
      className={
        variant === "panel"
          ? "w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-[14px] text-[#C0402E] hover:bg-[#F6F7F3] transition-colors"
          : "w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-[15px] text-[#E27D64] hover:bg-white/10 transition-colors"
      }
    >
      <LogoutIcon />
      Log out
    </button>
  </div>
);

const Navbar = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const accountRef = useRef(null);
  const moreRef = useRef(null);

  const isStaff = user?.role === "admin";
  const activeCategory = new URLSearchParams(location.search).get("category");

  const inlineCategories = categories.slice(0, MAX_INLINE_CATEGORIES);
  const overflowCategories = categories.slice(MAX_INLINE_CATEGORIES);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== "Escape") return;
      setMobileOpen(false);
      setMobileSearchOpen(false);
      setAccountOpen(false);
      setMoreOpen(false);
    };
    document.addEventListener("keydown", handleKey);

    const locked = mobileOpen || mobileSearchOpen;
    document.body.style.overflow = locked ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, mobileSearchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(searchValue.trim())}`);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchValue("");
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setAccountOpen(false);
    setMobileOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#241A14]/95 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]"
            : "bg-gradient-to-r from-[#2E2119] to-[#241A14] backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10">
          <div className={`flex items-center justify-between gap-6 transition-[height] duration-300 ${scrolled ? "h-[60px]" : "h-16"}`}>
            <BrandMark onClick={() => setMobileOpen(false)} />

            {/* Desktop category nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {categoriesLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className="h-[30px] w-20 rounded-full bg-white/10 animate-pulse mx-0.5" />
                ))}

              {!categoriesLoading && categoriesError && (
                <span className="text-[13px] text-[#E27D64] italic px-2">Couldn't load categories</span>
              )}

              {!categoriesLoading && !categoriesError && categories.length === 0 && (
                <span className="text-[13px] text-[#F6F1E7]/45 italic px-2">No categories yet</span>
              )}

              {!categoriesLoading &&
                !categoriesError &&
                inlineCategories.map((cat) => {
                  const isActive = activeCategory === cat.slug;
                  return (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/shop?category=${cat.slug}`}
                      className="relative px-3.5 py-2 rounded-full text-[14px] font-medium transition-colors duration-150 text-[#F6F1E7]/85 hover:text-[#F6F1E7] hover:bg-white/[0.07]"
                    >
                      {cat.name}
                      {isActive && (
                        <span className="absolute left-1/2 -translate-x-1/2 -bottom-[3px] w-1 h-1 rounded-full bg-[#C9A66B]" />
                      )}
                      {isActive && <span className="absolute inset-0 rounded-full bg-white/[0.06] ring-1 ring-[#C9A66B]/40 -z-10" />}
                    </Link>
                  );
                })}

              {!categoriesLoading && !categoriesError && overflowCategories.length > 0 && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-expanded={moreOpen}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[14px] font-medium text-[#F6F1E7]/85 hover:text-[#F6F1E7] hover:bg-white/[0.07] transition-colors duration-150"
                  >
                    More
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                  </button>

                  <div
                    className={`absolute left-0 mt-2 w-56 rounded-2xl border border-[#3B2A22] bg-[#2E2119] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.55)] py-1.5 max-h-80 overflow-y-auto origin-top transition-all duration-150 ${
                      moreOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    {overflowCategories.map((cat) => {
                      const isActive = activeCategory === cat.slug;
                      return (
                        <Link
                          key={cat._id || cat.slug}
                          to={`/shop?category=${cat.slug}`}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center justify-between px-4 py-2.5 text-[14px] transition-colors ${
                            isActive ? "text-[#C9A66B] bg-white/[0.04]" : "text-[#F6F1E7]/85 hover:bg-white/[0.07]"
                          }`}
                        >
                          {cat.name}
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Desktop search */}
              <div className="hidden sm:flex items-center">
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <div
                    className={`flex items-center overflow-hidden rounded-full border transition-all duration-300 ease-out ${
                      searchOpen
                        ? "w-60 bg-black/25 border-[#C9A66B]/40 pl-3.5 pr-1"
                        : "w-9 bg-transparent border-transparent"
                    }`}
                  >
                    <button
                      type={searchOpen ? "button" : "submit"}
                      onClick={() => !searchOpen && setSearchOpen(true)}
                      aria-label="Search products"
                      className="w-7 h-9 flex items-center justify-center text-[#F6F1E7]/85 hover:text-[#F6F1E7] shrink-0"
                    >
                      <SearchIcon />
                    </button>
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onBlur={() => !searchValue && setSearchOpen(false)}
                      placeholder="Search sofas, beds, decor…"
                      tabIndex={searchOpen ? 0 : -1}
                      className={`bg-transparent text-[13px] text-[#F6F1E7] placeholder:text-[#F6F1E7]/45 focus:outline-none py-2 transition-opacity duration-200 ${
                        searchOpen ? "opacity-100 w-full pr-2" : "opacity-0 w-0"
                      }`}
                    />
                  </div>
                </form>
              </div>

              {/* Mobile search trigger */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search products"
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#F6F1E7]/85 hover:text-[#F6F1E7] hover:bg-white/[0.07] transition-colors duration-150"
              >
                <SearchIcon />
              </button>

              {/* Auth area */}
              {!authLoading && (
                <>
                  {user ? (
                    <div className="hidden md:flex items-center gap-2">
                      {isStaff && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#C9A66B]/40 bg-white/[0.04] text-[13.5px] font-medium text-[#F6F1E7] hover:bg-white/[0.08] hover:border-[#C9A66B]/60 transition-colors duration-150"
                        >
                          <DashboardIcon />
                          Dashboard
                        </Link>
                      )}

                      <div className="relative" ref={accountRef}>
                        <button
                          onClick={() => setAccountOpen((v) => !v)}
                          aria-label="Account menu"
                          aria-expanded={accountOpen}
                          className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border border-[#C9A66B]/40 bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-150"
                        >
                          <Avatar name={user.username} />
                          <ChevronDown className={`w-3.5 h-3.5 text-[#F6F1E7]/70 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                        </button>

                        <div
                          className={`absolute right-0 mt-2 w-56 rounded-2xl border border-[#E1E3DD] bg-white shadow-[0_20px_50px_-16px_rgba(20,23,28,0.3)] overflow-hidden origin-top-right transition-all duration-150 ${
                            accountOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                          }`}
                        >
                          <AccountMenu
                            user={user}
                            isStaff={isStaff}
                            onNavigate={() => setAccountOpen(false)}
                            onLogout={handleLogout}
                            variant="panel"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="hidden md:inline-flex items-center justify-center rounded-full border border-[#C9A66B]/50 text-[13.5px] font-medium text-[#F6F1E7] px-4 py-2 hover:bg-white/[0.08] transition-colors duration-150"
                    >
                      Staff login
                    </Link>
                  )}
                </>
              )}

              {!authLoading && user && (
                <span className="md:hidden">
                  <Avatar name={user.username} size="w-8 h-8" textSize="text-[12px]" />
                </span>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#F6F1E7] hover:bg-white/[0.08] transition-colors duration-150"
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Brass hairline seam */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A66B]/70 to-transparent" />
      </header>

      {/* -------------------------------------------------------------- */}
      {/* Mobile search overlay — full-width slide-down bar               */}
      {/* -------------------------------------------------------------- */}
      <div
        className={`fixed inset-0 z-[60] sm:hidden transition-opacity duration-200 ${
          mobileSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSearchOpen(false)} />
        <div
          className={`relative bg-[#241A14] border-b border-[#3B2A22] px-5 pt-5 pb-6 transition-transform duration-300 ease-out ${
            mobileSearchOpen ? "translate-y-0" : "-translate-y-6"
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2.5 bg-black/25 border border-[#C9A66B]/30 rounded-full px-4 py-3">
              <SearchIcon className="w-[18px] h-[18px] text-[#F6F1E7]/60 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search sofas, beds, decor…"
                className="flex-1 bg-transparent text-[14px] text-[#F6F1E7] placeholder:text-[#F6F1E7]/45 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-[#F6F1E7]/70 hover:text-[#F6F1E7] hover:bg-white/[0.08] transition-colors"
            >
              <CloseIcon />
            </button>
          </form>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Mobile drawer — slides in from the right, backdrop dims content */}
      {/* -------------------------------------------------------------- */}
      <div className={`fixed inset-0 z-[70] md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#241A14] border-l border-[#3B2A22] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.6)] flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#3B2A22] shrink-0">
            <BrandMark onClick={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#F6F1E7] hover:bg-white/[0.08] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#F6F1E7]/40 mb-3 px-1">
              Shop by category
            </p>
            <nav className="flex flex-col gap-1 mb-6">
              {categoriesLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="h-11 rounded-lg bg-white/[0.06] animate-pulse" />
                ))}

              {!categoriesLoading && categoriesError && (
                <span className="px-3 py-2.5 text-[14px] text-[#E27D64] italic">
                  Couldn't load categories — check your connection
                </span>
              )}

              {!categoriesLoading && !categoriesError && categories.length === 0 && (
                <span className="px-3 py-2.5 text-[14px] text-[#F6F1E7]/45 italic">
                  No categories yet — check back soon
                </span>
              )}

              {!categoriesLoading &&
                !categoriesError &&
                categories.map((cat) => {
                  const isActive = activeCategory === cat.slug;
                  return (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/shop?category=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                        isActive ? "bg-[#C9A66B] text-[#241A14]" : "text-[#F6F1E7] hover:bg-white/[0.07]"
                      }`}
                    >
                      {cat.name}
                      <ChevronRight className={`w-4 h-4 ${isActive ? "text-[#241A14]/60" : "text-[#F6F1E7]/30"}`} />
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* Fixed account footer */}
          <div className="shrink-0 border-t border-[#3B2A22] px-5 py-5">
            {!authLoading && user ? (
              <AccountMenu
                user={user}
                isStaff={isStaff}
                onNavigate={() => setMobileOpen(false)}
                onLogout={handleLogout}
                variant="drawer"
              />
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center rounded-full bg-gradient-to-r from-[#C9A66B] to-[#9C7A45] text-[#241A14] text-[14px] font-semibold px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Staff login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;