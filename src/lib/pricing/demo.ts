import { HOME_LOCATION, type PriceCheckResult, type StoreOffer } from "./types";

/**
 * Demo price estimator. Produces stable, plausible per-store offers around a
 * base price so the price-watch flow is fully usable without an API key.
 * Links point at each retailer's real search results for the query.
 */

const STORES: { store: string; searchUrl: (q: string) => string; bias: number }[] = [
  {
    store: "Home Depot",
    searchUrl: (q) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`,
    bias: 0,
  },
  {
    store: "Lowe's",
    searchUrl: (q) => `https://www.lowes.com/search?searchTerm=${encodeURIComponent(q)}`,
    bias: 0.01,
  },
  {
    store: "Amazon",
    searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    bias: -0.04,
  },
  {
    store: "Ace Hardware",
    searchUrl: (q) => `https://www.acehardware.com/search?query=${encodeURIComponent(q)}`,
    bias: 0.05,
  },
  {
    store: "Menards",
    searchUrl: (q) => `https://www.menards.com/main/search.html?search=${encodeURIComponent(q)}`,
    bias: -0.02,
  },
  {
    store: "Walmart",
    searchUrl: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
    bias: -0.03,
  },
];

/** Deterministic hash so the same query yields the same "market" every time. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function retailPrice(raw: number): number {
  if (raw >= 1000) return Math.round(raw / 10) * 10;
  if (raw >= 100) return Math.round(raw) - 0.03; // x.97 endings
  return Math.round(raw * 2) / 2 - 0.01;
}

export function demoPriceCheck(query: string, basePrice?: number): PriceCheckResult {
  const seed = hash(query.toLowerCase().trim());
  const rand = mulberry32(seed);
  const base = basePrice && basePrice > 0 ? basePrice : 40 + rand() * 400;

  // A rotating subset of stores "carries" the item
  const carriers = STORES.filter((_, i) => mulberry32(seed + i)() > 0.22);
  const list = carriers.length >= 3 ? carriers : STORES.slice(0, 4);

  const offers: StoreOffer[] = list
    .map((s, i) => {
      const r = mulberry32(seed * 31 + i * 7)();
      const price = retailPrice(base * (0.93 + s.bias + r * 0.16));
      const delivery =
        s.store === "Amazon"
          ? "Free delivery"
          : r > 0.5
            ? "Free pickup nearby"
            : "In stock nearby";
      return {
        store: s.store,
        title: query,
        price: Math.max(1, price),
        url: s.searchUrl(query),
        delivery,
        estimated: true,
      };
    })
    .sort((a, b) => a.price - b.price);

  return {
    provider: "demo",
    location: HOME_LOCATION.display,
    checkedAt: new Date().toISOString(),
    offers,
  };
}
