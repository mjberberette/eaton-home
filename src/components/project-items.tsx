"use client";

import { useState } from "react";
import { Check, ExternalLink, ListChecks, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHome } from "@/lib/data-context";
import { formatMoney, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Everything a project needs to get done: per-item name, price, and buy link,
 * with a purchased checklist and a running total.
 */
export function ProjectItems({ project }: { project: Project }) {
  const { addItem, updateItem, deleteItem, updateProject } = useHome();
  const items = project.items ?? [];
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");

  const total = items.reduce((s, it) => s + it.price, 0);
  const boughtTotal = items.filter((it) => it.purchased).reduce((s, it) => s + it.price, 0);
  const boughtCount = items.filter((it) => it.purchased).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addItem(project.id, {
      name: name.trim(),
      price: Number(price) || 0,
      url: url.trim() || undefined,
      purchased: false,
    });
    setName("");
    setPrice("");
    setUrl("");
  }

  return (
    <section data-reveal className="glass rounded-[1.75rem] p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ListChecks className="h-4.5 w-4.5" />
          <h2 className="text-sm font-normal tracking-wide uppercase">Items needed</h2>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-light text-muted-foreground">
            {boughtCount} of {items.length} purchased
          </span>
        )}
      </div>
      <p className="mb-4 text-xs font-light text-muted-foreground">
        Break the project into the parts it needs — link where to buy each one.
      </p>

      {items.length === 0 && (
        <p className="mb-4 rounded-2xl border border-dashed border-border bg-white/[0.03] px-5 py-5 text-center text-sm font-light text-muted-foreground">
          No items yet — add the first thing this project needs.
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "group flex items-center gap-3 rounded-xl bg-white/[0.05] px-3.5 py-2.5",
              item.purchased && "opacity-60"
            )}
          >
            <button
              onClick={() => updateItem(project.id, item.id, { purchased: !item.purchased })}
              aria-label={item.purchased ? `Unmark ${item.name}` : `Mark ${item.name} purchased`}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
                item.purchased
                  ? "border-brand-green bg-brand-green text-brand-ink"
                  : "border-white/25 hover:border-brand-cyan"
              )}
            >
              {item.purchased && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-normal hover:underline",
                    item.purchased && "line-through"
                  )}
                >
                  <span className="truncate">{item.name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                </a>
              ) : (
                <p className={cn("truncate text-sm font-normal", item.purchased && "line-through")}>
                  {item.name}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-light tabular-nums">
              {formatMoney(item.price)}
            </span>
            <button
              onClick={() => deleteItem(project.id, item.id)}
              aria-label={`Delete ${item.name}`}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-white/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-4 py-2.5">
          <span className="text-xs font-light text-muted-foreground">
            {formatMoney(boughtTotal)} purchased so far
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-normal tabular-nums">
              Total {formatMoney(total)}
            </span>
            {total > 0 && total !== project.estimatedCost && (
              <button
                onClick={() => updateProject(project.id, { estimatedCost: total })}
                className="text-[11px] font-light text-brand-cyan underline-offset-2 hover:underline"
              >
                Set as project cost
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-2">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name (e.g. Cable railing kit)"
            className="glass-chip h-11 min-w-0 flex-1 rounded-xl font-light"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$"
            className="glass-chip h-11 w-24 shrink-0 rounded-xl font-light"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link to buy (optional)"
            className="glass-chip h-11 min-w-0 flex-1 rounded-xl font-light"
          />
          <Button
            type="submit"
            disabled={!name.trim()}
            variant="outline"
            className="glass-chip h-11 shrink-0 rounded-xl px-4 font-light"
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </form>
    </section>
  );
}
