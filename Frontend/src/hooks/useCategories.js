// Fetches /api/v1/categories once per page load and shares the result between
// Navbar, Footer and the Home category grid (previously each fetched its own).
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

let cache = null;
let inflight = null;

const loadCategories = () => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch(`${API_BASE}/api/v1/categories`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((json) => {
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        cache = list;
        return list;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

export function useCategories() {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    loadCategories()
      .then((list) => {
        if (!cancelled) {
          setCategories(list);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("Could not load categories", err);
        if (!cancelled) {
          setCategories([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}
