// src/components/admin/products/ProductCard.jsx

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function PriceDisplay({ pricing }) {
    if (pricing.displayMode === "contact_for_price") {
        return <span className="text-sm font-medium text-stone">Contact for price</span>;
    }
    if (pricing.displayMode === "starting_from") {
        return (
            <span className="text-sm font-semibold text-ink">
                From {money(pricing.sellingPrice)}
            </span>
        );
    }
    return <span className="text-sm font-semibold text-ink">{money(pricing.sellingPrice)}</span>;
}

function StockBadge({ product }) {
    if (!product.isActive) {
        return <span className="rounded-full bg-linen px-2 py-0.5 text-[11px] font-medium text-stone">Deactivated</span>;
    }
    if (product.stock.current <= 0) {
        return product.outOfStockAction === "hide" ? (
            <span className="rounded-full bg-linen px-2 py-0.5 text-[11px] font-medium text-stone">Hidden (out of stock)</span>
        ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">Out of stock</span>
        );
    }
    if (product.stock.current <= product.stock.lowStockThreshold) {
        return (
            <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[11px] font-medium text-clay-deep">
                Low stock · {product.stock.current} left
            </span>
        );
    }
    return (
        <span className="rounded-full bg-moss/10 px-2 py-0.5 text-[11px] font-medium text-moss">
            {product.stock.current} in stock
        </span>
    );
}

// onEdit is a stub for now — wire it to a ProductEditForm (reusing
// ProductCreateForm in edit mode) once that's built.
export default function ProductCard({ product, onToggleStatus, onDelete, onEdit }) {
    const thumbnail = product.images?.[0]?.url;

    return (
        <div className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-card transition hover:border-clay/50 hover:shadow-[0_12px_32px_-16px_rgba(42,37,31,0.3)]">
            {/* 4:3 well on Linen; multiply blend lets white-background photos melt in */}
            <div className="relative aspect-[4/3] bg-linen">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={product.name}
                        className="h-full w-full object-cover mix-blend-multiply transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-clay/60">
                            <path
                                d="M3 7l1.4-2.8A2 2 0 016.2 3h11.6a2 2 0 011.8 1.2L21 7M3 7h18M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M9 11a3 3 0 006 0"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                )}
                {(product.isFeatured || product.isNewArrival) && (
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        {product.isNewArrival && (
                            <span className="rounded-full bg-moss/90 px-2 py-0.5 text-[10px] font-medium text-card backdrop-blur-sm">
                                New
                            </span>
                        )}
                        {product.isFeatured && (
                            <span className="rounded-full bg-clay-deep/90 px-2 py-0.5 text-[10px] font-medium text-card backdrop-blur-sm">
                                Featured
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
                <h4 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-ink">{product.name}</h4>

                {product.brand && <p className="text-xs text-stone">{product.brand}</p>}

                <div className="mt-0.5 flex items-center justify-between">
                    <PriceDisplay pricing={product.pricing} />
                </div>

                <div>
                    <StockBadge product={product} />
                </div>

                <div className="mt-auto flex items-center gap-3 border-t border-line pt-2.5 text-xs">
                    <button
                        type="button"
                        onClick={() => onEdit?.(product)}
                        className="font-medium text-moss transition hover:text-ink"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleStatus(product)}
                        className="font-medium text-stone transition hover:text-ink"
                    >
                        {product.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="ml-auto font-medium text-red-700 transition hover:text-red-800"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}