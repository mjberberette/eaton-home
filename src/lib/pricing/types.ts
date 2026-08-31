export interface StoreOffer {
  store: string;
  title: string;
  price: number;
  url: string;
  delivery?: string;
  /** True when produced by the demo estimator rather than a live lookup */
  estimated: boolean;
}

export interface PriceCheckResult {
  provider: "serpapi" | "demo";
  /** Human-readable location the prices are scoped to */
  location: string;
  checkedAt: string;
  offers: StoreOffer[];
}

/** Where the Eatons shop — used for location-scoped price lookups. */
export const HOME_LOCATION = {
  display: "Parker, CO 80134",
  /** SerpApi `location` parameter value */
  serpapi: "Parker, Colorado, United States",
};
