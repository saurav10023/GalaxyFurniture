// utils/sanitizeProduct.js
const sanitizeProduct = (product, isAdmin) => {
    const obj = product.toObject ? product.toObject() : { ...product };

    if (isAdmin) return obj;

    // --- Customer-facing view only below this line ---

    const { displayMode, sellingPrice, negotiation } = obj.pricing || {};

    let priceView;
    switch (displayMode) {
        case "contact_for_price":
            priceView = { displayMode, message: "Contact for price" };
            break;
        case "starting_from":
            priceView = { displayMode, startingFrom: sellingPrice };
            break;
        case "show_price":
        default:
            priceView = { displayMode, sellingPrice };
            break;
    }

    priceView.negotiable = Boolean(negotiation?.enabled);
    obj.pricing = priceView;

    // Strip internal/operational fields not meant for the catalog
    delete obj.stock;
    delete obj.supplier;
    delete obj.attributes;
    delete obj.availabilityStatus;
    delete obj.outOfStockAction;
    delete obj.isActive;

    return obj;
};

const sanitizeProductList = (products, isAdmin) => {
    return products.map((p) => sanitizeProduct(p, isAdmin));
};

export { sanitizeProduct, sanitizeProductList };