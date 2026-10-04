// src/components/ProductCard.jsx
// Shared light-theme product card used on the home page.
// mix-blend-multiply lets product photos shot on white/grey backgrounds
// melt into the cream surface instead of showing a hard white box.

import { Link } from "react-router-dom";
import { Armchair } from "lucide-react";
import { displayName, firstImage, priceLabel } from "../lib/product";

const ProductCard = ({ product }) => {
  const img = firstImage(product);
  const price = priceLabel(product);
  const category = displayName(product.category);

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-4 focus-visible:ring-offset-paper rounded-2xl"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-linen">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-5 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Armchair className="w-12 h-12 text-clay/60 stroke-[1]" />
          </div>
        )}

        {product.isNewArrival && (
          <span className="absolute top-3 left-3 rounded-full bg-card/90 border border-line px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-moss">
            New
          </span>
        )}
      </div>

      <div className="pt-4 px-0.5">
        {category && (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone truncate">
            {category}
          </p>
        )}
        <h3 className="mt-1 font-serif text-[21px] leading-tight font-semibold text-ink line-clamp-1 group-hover:text-moss transition-colors">
          {product.name}
        </h3>
        <p className="mt-1.5 text-[14.5px] text-ink/80">
          {price.prefix && <span className="text-stone mr-1">{price.prefix}</span>}
          <span className={price.numeric ? "font-medium" : "text-stone italic"}>{price.text}</span>
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
