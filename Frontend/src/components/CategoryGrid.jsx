// src/components/CategoryGrid.jsx
// Dynamic "Shop by category" tiles. Categories come from the API (admins can
// add new ones without code changes); each tile borrows the first product's
// photo and the category's piece count.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Armchair } from "lucide-react";
import API from "../api/axios";
import { useCategories } from "../hooks/useCategories";
import { firstImage } from "../lib/product";

const MAX_TILES = 8;

const CategoryTile = ({ category }) => {
  const [preview, setPreview] = useState({ image: "", total: null });

  useEffect(() => {
    let cancelled = false;
    API.get("/api/v1/products/search", { params: { category: category._id, limit: 1 } })
      .then((res) => {
        const list = res?.data?.data?.products || [];
        const total = res?.data?.data?.pagination?.total ?? list.length;
        if (!cancelled) setPreview({ image: firstImage(list[0]), total });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [category._id]);

  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-linen focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
    >
      {preview.image ? (
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-6 pb-20 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pb-16">
          <Armchair className="w-12 h-12 text-clay/60 stroke-[1]" />
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-card/95 backdrop-blur border border-line px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[21px] font-semibold leading-tight text-ink truncate">
            {category.name}
          </h3>
          {preview.total !== null && (
            <p className="text-[12px] text-stone mt-0.5">
              {preview.total} {preview.total === 1 ? "piece" : "pieces"}
            </p>
          )}
        </div>
        <span className="shrink-0 w-8 h-8 rounded-full border border-line flex items-center justify-center text-ink transition-colors group-hover:bg-moss group-hover:text-paper group-hover:border-moss">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};

const CategoryGrid = () => {
  const { categories, loading, error } = useCategories();

  if (!loading && (error || categories.length === 0)) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-linen animate-pulse" />
          ))
        : categories.slice(0, MAX_TILES).map((c) => <CategoryTile key={c._id || c.slug} category={c} />)}
    </div>
  );
};

export default CategoryGrid;
