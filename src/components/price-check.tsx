"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin, RefreshCw, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHome } from "@/lib/data-context";
import { formatMoney, type Project } from "@/lib/types";
import type { PriceCheckResult } from "@/lib/pricing/types";
import { cn } from "@/lib/utils";

export function PriceCheck({ project }: { project: Project }) {
  const { addPricePoint, updateProject } = useHome();
  const [query, setQuery] = useState(project.title);
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedUrl, setLoggedUrl] = useState<string | null>(null);

  async function check() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setLoggedUrl(null);
    try {
      const res = await fetch("/api/price-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), basePrice: project.estimatedCost }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      setResult((await res.json()) as PriceCheckResult);
    } catch {
      setError("Couldn't reach the price service — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function logOffer(store: string, price: number, url: string) {
    addPricePoint(project.id, {
      date: new Date().toISOString().slice(0, 10),
      price,
      note: `${store} · price check`,
    });
    updateProject(project.id, { storeName: store, storeUrl: url });
    setLoggedUrl(url);
  }

  const lowestPrice = result?.offers.length
    ? Math.min(...result.offers.map((o) => o.price))
    : null;

  return (
    <section data-reveal className="glass rounded-[1.75rem] p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Store className="h-4.5 w-4.5" />
          <h2 className="text-sm font-normal tracking-wide uppercase">Shop the market</h2>
        </div>
        <span className="glass-chip flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-light text-muted-foreground">
          <MapPin className="h-3 w-3 text-brand-cyan" />
          near {result?.location ?? "Parker, CO 80134"}
        </span>
      </div>
      <p className="mb-4 text-xs font-light text-muted-foreground">
        Compare today&apos;s prices across Home Depot, Lowe&apos;s, Amazon, and other
        stores that carry it — then log the best one.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
        className="flex gap-2"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What exactly are we pricing?"
          className="glass-chip h-11 rounded-xl font-light"
        />
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-11 shrink-0 rounded-xl px-4 font-light"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Check prices
        </Button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-light text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[54px] animate-pulse rounded-xl bg-white/[0.05]"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}

      {result && !loading && (
        <>
          <div className="mt-4 space-y-2">
            {result.offers.map((offer) => {
              const isLowest = offer.price === lowestPrice;
              const isLogged = loggedUrl === offer.url;
              return (
                <div
                  key={offer.store + offer.url}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-transparent bg-white/[0.05] px-4 py-2.5",
                    isLowest && "border-brand-cyan/35"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-sm font-normal hover:underline"
                      >
                        {offer.store}
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </a>
                      {isLowest && (
                        <span className="rounded-full bg-brand-cyan/15 px-2 py-0.5 text-[10px] font-normal text-teal-200">
                          Lowest
                        </span>
                      )}
                    </div>
                    {offer.delivery && (
                      <p className="text-[11px] font-light text-muted-foreground">
                        {offer.delivery}
                      </p>
                    )}
                  </div>
                  <span className="font-light tabular-nums">{formatMoney(offer.price)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLogged}
                    onClick={() => logOffer(offer.store, offer.price, offer.url)}
                    className="glass-chip h-8 rounded-lg px-3 text-xs font-light"
                  >
                    {isLogged ? "Logged ✓" : "Log"}
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-light text-muted-foreground">
            {result.provider === "demo"
              ? "Estimated prices with real store search links — set SERPAPI_KEY for live local pricing."
              : `Live Google Shopping prices · checked ${new Date(result.checkedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
          </p>
        </>
      )}
    </section>
  );
}
