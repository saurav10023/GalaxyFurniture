// utils/buildSortQuery.js
const SORT_MAP = {
    "price-asc": { "pricing.sellingPrice": 1 },
    "price-desc": { "pricing.sellingPrice": -1 },
    "name-asc": { name: 1 },
    "name-desc": { name: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 }
};

const buildSortQuery = (sort) => SORT_MAP[sort] || SORT_MAP.newest;

export { buildSortQuery };