// src/components/admin/products/ProductCard.jsx

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function PriceDisplay({ pricing }) {
    if (pricing.displayMode === "contact_for_price") {
        return <span className="text-sm font-medium text-slate-600">Contact for price</span>;
    }
    if (pricing.displayMode === "starting_from") {
        return (
            <span className="text-sm font-semibold text-slate-800">
                From {money(pricing.sellingPrice)}
            </span>
        );
    }
    return <span className="text-sm font-semibold text-slate-800">{money(pricing.sellingPrice)}</span>;
}

function StockBadge({ product }) {
    if (!product.isActive) {
        return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">Deactivated</span>;
    }
    if (product.stock.current <= 0) {
        return product.outOfStockAction === "hide" ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">Hidden (out of stock)</span>
        ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">Out of stock</span>
        );
    }
    if (product.stock.current <= product.stock.lowStockThreshold) {
        return (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Low stock · {product.stock.current} left
            </span>
        );
    }
    return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {product.stock.current} in stock
        </span>
    );
}

// onEdit is a stub for now — wire it to a ProductEditForm (reusing
// ProductCreateForm in edit mode) once that's built.
export default function ProductCard({ product, onToggleStatus, onDelete, onEdit }) {
    const thumbnail = product.images?.[0]?.url;

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
            <div className="relative aspect-square bg-slate-100">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-slate-300">
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
                    <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
                        {product.isNewArrival && (
                            <span className="rounded-full bg-indigo-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                                New
                            </span>
                        )}
                        {product.isFeatured && (
                            <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                                Featured
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
                <h4 className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">{product.name}</h4>

                {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}

                <div className="mt-0.5 flex items-center justify-between">
                    <PriceDisplay pricing={product.pricing} />
                </div>

                <div>
                    <StockBadge product={product} />
                </div>

                <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-2 text-xs">
                    <button
                        type="button"
                        onClick={() => onEdit?.(product)}
                        className="font-medium text-indigo-600 transition hover:text-indigo-700"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleStatus(product)}
                        className="font-medium text-slate-500 transition hover:text-slate-700"
                    >
                        {product.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="ml-auto font-medium text-red-500 transition hover:text-red-600"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}