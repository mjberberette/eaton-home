"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type PricePoint, type ProjectStatus } from "@/lib/types";

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const styles: Record<ProjectStatus, string> = {
    idea: "bg-secondary text-secondary-foreground",
    planned: "bg-brand-yellow/15 text-yellow-200",
    in_progress: "bg-brand-orange/15 text-orange-200",
    done: "bg-brand-cyan/15 text-teal-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-normal tracking-wide",
        styles[status],
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-muted-foreground/60": status === "idea",
          "bg-brand-yellow": status === "planned",
          "bg-brand-orange": status === "in_progress",
          "bg-brand-cyan": status === "done",
        })}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function priceTrend(history: PricePoint[]) {
  if (history.length < 2) return { pct: 0, direction: "flat" as const };
  const first = history[0].price;
  const last = history[history.length - 1].price;
  const pct = ((last - first) / first) * 100;
  return {
    pct,
    direction: pct < -0.5 ? ("down" as const) : pct > 0.5 ? ("up" as const) : ("flat" as const),
  };
}

export function TrendChip({ history, className }: { history: PricePoint[]; className?: string }) {
  const { pct, direction } = priceTrend(history);
  const Icon = direction === "down" ? ArrowDownRight : direction === "up" ? ArrowUpRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-normal",
        direction === "down" && "bg-brand-cyan/15 text-teal-200",
        direction === "up" && "bg-destructive/15 text-destructive",
        direction === "flat" && "bg-muted text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/** Minimal SVG line chart for price history. */
export function Sparkline({
  history,
  className,
  stroke = "currentColor",
  height = 44,
}: {
  history: PricePoint[];
  className?: string;
  stroke?: string;
  height?: number;
}) {
  if (history.length < 2) {
    return (
      <div className={cn("flex items-center text-xs font-light text-muted-foreground", className)}>
        Tracking…
      </div>
    );
  }
  const w = 160;
  const prices = history.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 6;
  const points = history.map((p, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p.price - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={stroke} />
    </svg>
  );
}
