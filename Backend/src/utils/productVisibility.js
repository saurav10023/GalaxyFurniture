// utils/productVisibility.js
// Shared with product.controller.js so both files apply the exact same
// "what can a customer see" rule. Keeping this in one place avoids the
// two controllers silently drifting apart over time.
export const publicVisibilityFilter = {
    isActive: true,
    $or: [
        { "stock.current": { $gt: 0 } },
        { outOfStockAction: "show_as_out_of_stock" }
    ]
};