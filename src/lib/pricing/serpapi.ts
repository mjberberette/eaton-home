import { HOME_LOCATION, type PriceCheckResult, type StoreOffer } from "./types";

/**
 * Live price lookup via SerpApi's Google Shopping engine.
 * One key covers Home Depot, Lowe's, Amazon, Ace, Menards, Walmart, and more,
 * with results priced for the configured location (Parker, CO).
 * https://serpapi.com/google-shopping-api
 */

interface SerpShoppingResult {
  title?: string;
  source?: string;
  link?: string;
  product_link?: string;
  extracted_price?: number;
  delivery?: string;
}

/** Retailers the Eatons actually shop at get sorted to the front. */
const PREFERRED = [
  "home depot",
  "lowe's",
  "lowes",
  "amazon",
  "ace hardware",
  "menards",
  "walmart",
  "costco",
  "target",
  "floor & decor",
  "wayfair",
];

function preferenceRank(store: string): number {
  const s = store.toLowerCase();
  const idx = PREFERRED.findIndex((p) => s.includes(p));
  return idx === -1 ? PREFERRED.length : idx;
}

export async function serpApiPriceCheck(
  query: string,
  apiKey: string
): Promise<PriceCheckResult> {
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    location: HOME_LOCATION.serpapi,
    hl: "en",
    gl: "us",
    num: "30",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    // Prices move; never serve a stale cache
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`SerpApi responded ${res.status}`);
  }
  const data = (await res.json()) as {
    error?: string;
    shopping_results?: SerpShoppingResult[];
  };
  if (data.error) throw new Error(data.error);

  const seen = new Set<string>();
  const offers: StoreOffer[] = (data.shopping_results ?? [])
    .filter(
      (r): r is Required<Pick<SerpShoppingResult, "source" | "extracted_price">> &
        SerpShoppingResult =>
        Boolean(r.source && r.extracted_price && r.extracted_price > 0)
    )
    .sort(
      (a, b) =>
        preferenceRank(a.source!) - preferenceRank(b.source!) ||
        a.extracted_price! - b.extracted_price!
    )
    // Keep the cheapest offer per store
    .filter((r) => {
      const key = r.source!.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8)
    .map((r) => ({
      store: r.source!,
      title: r.title ?? query,
      price: r.extracted_price!,
      url: r.product_link ?? r.link ?? "",
      delivery: r.delivery,
      estimated: false,
    }))
    .sort((a, b) => a.price - b.price);

  return {
    provider: "serpapi",
    location: HOME_LOCATION.display,
    checkedAt: new Date().toISOString(),
    offers,
  };
}
