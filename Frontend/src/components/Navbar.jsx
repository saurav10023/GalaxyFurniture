// src/components/Navbar.jsx
// Seamless navbar: fully transparent at the top of the page (blends into the
// page background), turns into a light frosted pill once you scroll.
// Active category = solid olive pill. Mobile = slide-in drawer with search.

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LayoutDashboard, LogOut, Menu, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCategories } from "../hooks/useCategories";
import logo from "../assets/galaxy-novelty-logo.png";

const MAX_INLINE_CATEGORIES = 5;
const SCROLL_THRESHOLD = 12;

const navLink =
  "relative px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200";
const navIdle = "text-ink/75 hover:text-ink hover:bg-white/50";
const navActive = "bg-moss text-paper shadow-[0_6px_16px_-8px_rgba(57,58,34,0.8)]";

const BrandMark = ({ onClick }) => (
  <Link to="/" onClick={onClick} className="flex items-center gap-2 sm:gap-2.5 shrink-0 group min-w-0">
    <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 ring-1 ring-black/5 overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
      <img src={logo} alt="Galaxy Furniture" className="w-full h-full object-cover" />
    </span>
    <span className="font-serif text-[17px] sm:text-[23px] font-semibold text-ink tracking-[0.04em] sm:tracking-[0.02em] leading-none whitespace-nowrap">
      GALAXY <span className="text-clay italic font-medium">Furniture</span>
    </span>
  </Link>
);

const Avatar = ({ name, size = "w-9 h-9", text = "text-[13px]" }) => (
  <span
    className={`${size} ${text} rounded-full bg-moss text-paper font-semibold flex items-center justify-center uppercase shrink-0`}
  >
    {name?.charAt(0) || "U"}
  </span>
);

const AccountMenu = ({ user, isStaff, onNavigate, onLogout }) => (
  <div className="py-1.5">
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar name={user.username} size="w-10 h-10" text="text-[14px]" />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-ink truncate">{user.username}</p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone">
          {isStaff ? "Staff account" : "Account"}
        </p>
      </div>
    </div>
    <div className="h-px bg-line mb-1.5" />
    {isStaff && (
      <Link
        to="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-ink hover:bg-linen transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" />
        Admin Dashboard
      </Link>
    )}
    <button
      onClick={onLogout}
      className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-[14px] text-[#B5472F] hover:bg-linen transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Log out
    </button>
  </div>
);

const Navbar = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, loading: catLoading, error: catError } = useCategories();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const accountRef = useRef(null);
  const moreRef = useRef(null);

  const isStaff = user?.role === "admin";
  const activeCategory = new URLSearchParams(location.search).get("category");
  const onContact = location.pathname === "/contact";

  const inline = categories.slice(0, MAX_INLINE_CATEGORIES);
  const overflow = categories.slice(MAX_INLINE_CATEGORIES);
  const catsReady = !catLoading && !catError;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      setAccountOpen(false);
      setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setDrawerOpen(false);
    setSearchValue("");
  };

  const handleLogout = async () => {
    setAccountOpen(false);
    setDrawerOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 px-3 sm:px-5 pt-3">
        <div
          className={`mx-auto max-w-7xl rounded-full border transition-all duration-500 ${
            scrolled
              ? "bg-[#F1EADB]/75 backdrop-blur-xl backdrop-saturate-150 border-white/50 shadow-[0_12px_32px_-20px_rgba(42,37,31,0.35)]"
              : "bg-transparent backdrop-blur-0 border-transparent shadow-none"
          }`}
        >
          <div
            className={`flex items-center justify-between gap-4 px-2.5 sm:px-3 transition-[height] duration-300 ${
              scrolled ? "h-[54px]" : "h-[60px]"
            }`}
          >
            <BrandMark onClick={() => setDrawerOpen(false)} />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {catLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className="h-8 w-20 rounded-full bg-white/40 animate-pulse" />
                ))}

              {catsReady &&
                inline.map((cat) => {
                  const active = activeCategory === cat.slug;
                  return (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/shop?category=${cat.slug}`}
                      className={`${navLink} ${active ? navActive : navIdle}`}
                    >
                      {cat.name}
                    </Link>
                  );
                })}

              {catsReady && overflow.length > 0 && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-expanded={moreOpen}
                    className={`${navLink} ${navIdle} flex items-center gap-1`}
                  >
                    More
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div
                    className={`absolute left-0 mt-3 w-56 rounded-2xl border border-white/70 bg-[#FBF7EE]/95 backdrop-blur-xl shadow-[0_24px_50px_-20px_rgba(42,37,31,0.45)] py-1.5 max-h-80 overflow-y-auto origin-top transition-all duration-150 ${
                      moreOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    {overflow.map((cat) => (
                      <Link
                        key={cat._id || cat.slug}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center justify-between px-4 py-2.5 text-[14px] transition-colors ${
                          activeCategory === cat.slug ? "text-moss bg-linen" : "text-ink/80 hover:bg-linen"
                        }`}
                      >
                        {cat.name}
                        {activeCategory === cat.slug && <span className="w-1.5 h-1.5 rounded-full bg-moss" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!catLoading && (
                <Link to="/contact" className={`${navLink} ${onContact ? navActive : navIdle}`}>
                  Contact
                </Link>
              )}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Desktop expanding search */}
              <form onSubmit={submitSearch} className="hidden sm:flex">
                <div
                  className={`flex items-center overflow-hidden rounded-full border transition-all duration-300 ease-out ${
                    searchOpen ? "w-60 bg-white/60 border-white pl-3 pr-1" : "w-10 bg-transparent border-transparent"
                  }`}
                >
                  <button
                    type={searchOpen ? "button" : "submit"}
                    onClick={() => !searchOpen && setSearchOpen(true)}
                    aria-label="Search products"
                    className="w-9 h-10 shrink-0 flex items-center justify-center text-ink/75 hover:text-ink"
                  >
                    <Search className="w-[18px] h-[18px]" />
                  </button>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onBlur={() => !searchValue && setSearchOpen(false)}
                    placeholder="Search sofas, beds, decor…"
                    tabIndex={searchOpen ? 0 : -1}
                    className={`bg-transparent text-[13px] text-ink placeholder:text-stone/70 focus:outline-none py-2 transition-opacity duration-200 ${
                      searchOpen ? "opacity-100 w-full pr-2" : "opacity-0 w-0"
                    }`}
                  />
                </div>
              </form>

              {/* Mobile search → opens drawer */}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Search products"
                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full text-ink/75 hover:bg-white/50"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {!authLoading &&
                (user ? (
                  <div className="hidden md:flex items-center gap-2">
                    {isStaff && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-paper text-[13.5px] font-medium hover:bg-ink/85 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}
                    <div className="relative" ref={accountRef}>
                      <button
                        onClick={() => setAccountOpen((v) => !v)}
                        aria-label="Account menu"
                        aria-expanded={accountOpen}
                        className="flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full border border-white/70 bg-white/40 hover:bg-white/70 transition-colors"
                      >
                        <Avatar name={user.username} size="w-8 h-8" />
                        <ChevronDown className={`w-3.5 h-3.5 text-ink/60 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                      </button>
                      <div
                        className={`absolute right-0 mt-3 w-56 rounded-2xl border border-white/70 bg-[#FBF7EE]/95 backdrop-blur-xl shadow-[0_24px_50px_-20px_rgba(42,37,31,0.45)] overflow-hidden origin-top-right transition-all duration-150 ${
                          accountOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                        }`}
                      >
                        <AccountMenu
                          user={user}
                          isStaff={isStaff}
                          onNavigate={() => setAccountOpen(false)}
                          onLogout={handleLogout}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="hidden md:inline-flex items-center rounded-full bg-ink text-paper text-[13.5px] font-medium px-5 py-2.5 hover:bg-ink/85 transition-colors"
                  >
                    Staff login
                  </Link>
                ))}

              {!authLoading && user && (
                <span className="md:hidden">
                  <Avatar name={user.username} size="w-8 h-8" text="text-[12px]" />
                </span>
              )}

              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-ink hover:bg-white/50 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[70] md:hidden ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm bg-[#F4EFE6] border-l border-line shadow-[-24px_0_60px_-30px_rgba(42,37,31,0.55)] flex flex-col transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <BrandMark onClick={() => setDrawerOpen(false)} />
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 flex items-center justify-center rounded-full text-ink hover:bg-ink/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <form onSubmit={submitSearch} className="mb-6">
              <div className="flex items-center gap-2.5 bg-white/70 border border-line rounded-full px-4 py-3">
                <Search className="w-[18px] h-[18px] text-stone shrink-0" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search sofas, beds, decor…"
                  className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-stone/70 focus:outline-none"
                />
              </div>
            </form>

            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone mb-3 px-1">
              Shop by category
            </p>
            <nav className="flex flex-col gap-1">
              {catLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="h-11 rounded-xl bg-ink/5 animate-pulse" />
                ))}
              {!catLoading && catError && (
                <span className="px-3 py-2.5 text-[14px] text-[#B5472F] italic">Couldn't load categories</span>
              )}
              {catsReady &&
                categories.map((cat) => {
                  const active = activeCategory === cat.slug;
                  return (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/shop?category=${cat.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                        active ? "bg-moss text-paper" : "text-ink hover:bg-ink/5"
                      }`}
                    >
                      {cat.name}
                      <ChevronRight className={`w-4 h-4 ${active ? "text-paper/70" : "text-ink/30"}`} />
                    </Link>
                  );
                })}
              <Link
                to="/contact"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium text-ink hover:bg-ink/5 transition-colors"
              >
                Contact the showroom
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </Link>
            </nav>
          </div>

          <div className="shrink-0 border-t border-line px-5 py-5">
            {!authLoading && user ? (
              <div className="rounded-2xl bg-card border border-line overflow-hidden">
                <AccountMenu
                  user={user}
                  isStaff={isStaff}
                  onNavigate={() => setDrawerOpen(false)}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setDrawerOpen(false)}
                className="block text-center rounded-full bg-ink text-paper text-[14px] font-medium px-4 py-3"
              >
                Staff login
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default Navbar;