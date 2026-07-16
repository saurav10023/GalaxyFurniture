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
        return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Deactivated</span>;
    }
    if (product.stock.current <= 0) {
        return product.outOfStockAction === "hide" ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Hidden (out of stock)</span>
        ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Out of stock</span>
        );
    }
    if (product.stock.current <= product.stock.lowStockThreshold) {
        return (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Low stock · {product.stock.current} left
            </span>
        );
    }
    return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
            {product.stock.current} in stock
        </span>
    );
}

// onEdit is a stub for now — wire it to a ProductEditForm (reusing
// ProductCreateForm in edit mode) once that's built.
export default function ProductCard({ product, onToggleStatus, onDelete, onEdit }) {
    const thumbnail = product.images?.[0]?.url;

    return (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
            <div className="aspect-square bg-slate-100 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-xs text-slate-400">No image</span>
                )}
            </div>

            <div className="p-3 flex flex-col gap-1.5 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-800 line-clamp-2">{product.name}</h4>
                </div>

                {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}

                <div className="flex items-center justify-between mt-1">
                    <PriceDisplay pricing={product.pricing} />
                </div>

                <div>
                    <StockBadge product={product} />
                </div>

                <div className="mt-auto pt-2 flex items-center gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => onEdit?.(product)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleStatus(product)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                        {product.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 ml-auto"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}