// Shared, defensive helpers for rendering catalog products.
// Customer-facing API responses strip `stock`, `attributes`, etc. (see
// Backend/src/utils/sanitizeProduct.js) and pricing can be one of three
// display modes, so nothing here assumes a numeric sellingPrice exists.

export const displayName = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "number") return String(field);
  return field.name || field.title || field.slug || "";
};

// Single source of truth for shop details used across the public pages.
export const SITE = {
  name: "Galaxy Furniture",
  tagline: "Natural living",
  address: ["Galaxy Furniture", " Saldega Road, near Bal Bharti School, 835223", "Simdega, Jharkhand"],
  email: "galaxyfurniture6398@gmail.com",
  phone: "+91 7004187574",
  phoneHref: "tel:+917004187574",
  whatsappNumber: "917004187574",
  mapsHref: "https://www.google.com/maps/search/?api=1&query=Galaxy+Novelty+Simdega+Jharkhand",
};

export const whatsappLink = (message = "Hi Galaxy Furniture, I'd like to know more about your pieces.") =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
export const formatINR = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

// -> { prefix, text, numeric }
export const priceLabel = (product) => {
  const p = product?.pricing || {};
  if (p.displayMode === "contact_for_price") {
    return { prefix: "", text: "Contact for price", numeric: false };
  }
  if (p.displayMode === "starting_from") {
    return { prefix: "From", text: formatINR(p.startingFrom ?? p.sellingPrice), numeric: true };
  }
  if (p.sellingPrice === undefined || p.sellingPrice === null) {
    return { prefix: "", text: "Contact for price", numeric: false };
  }
  return { prefix: "", text: formatINR(p.sellingPrice), numeric: true };
};

export const firstImage = (product) => product?.images?.[0]?.url || "";

export const formatDimensions = (d) => {
  if (!d) return null;
  const parts = [d.length, d.width, d.height].filter((v) => v !== undefined && v !== null && v !== "");
  if (!parts.length) return null;
  return `${parts.join(" × ")}${d.unit ? ` ${d.unit}` : ""}`;
};
