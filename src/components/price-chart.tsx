"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatMoney, type PricePoint } from "@/lib/types";

const W = 640;
const H = 240;
const PAD = { top: 18, right: 18, bottom: 34, left: 56 };

function fmtDate(iso: string, withYear = false) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear && { year: "numeric" }),
  });
}

/** Catmull-Rom → bezier smoothing for a gently curved line */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** A real line graph for price history: axes, grid, hover tooltips, lowest marker. */
export function PriceChart({
  history,
  className,
}: {
  history: PricePoint[];
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...history].sort((a, b) => a.date.localeCompare(b.date)),
    [history]
  );

  const model = useMemo(() => {
    if (sorted.length < 2) return null;
    const prices = sorted.map((p) => p.price);
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const span = rawMax - rawMin || rawMax * 0.1 || 1;
    const min = Math.max(0, rawMin - span * 0.18);
    const max = rawMax + span * 0.18;

    const t0 = new Date(sorted[0].date).getTime();
    const t1 = new Date(sorted[sorted.length - 1].date).getTime();
    const tSpan = t1 - t0 || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const pts = sorted.map((p) => ({
      x: PAD.left + ((new Date(p.date).getTime() - t0) / tSpan) * innerW,
      y: PAD.top + (1 - (p.price - min) / (max - min)) * innerH,
      point: p,
    }));

    // 4 horizontal gridlines with round-ish dollar values
    const ticks = [0, 1, 2, 3].map((i) => {
      const value = max - ((max - min) * i) / 3;
      return { value, y: PAD.top + (innerH * i) / 3 };
    });

    // Up to 4 date labels, evenly picked
    const labelIdx =
      pts.length <= 4
        ? pts.map((_, i) => i)
        : [0, Math.round((pts.length - 1) / 3), Math.round(((pts.length - 1) * 2) / 3), pts.length - 1];

    const lowestIdx = prices.indexOf(rawMin);
    return { pts, ticks, labelIdx: [...new Set(labelIdx)], lowestIdx };
  }, [sorted]);

  if (!model) {
    return (
      <div
        className={cn(
          "flex h-40 items-center justify-center rounded-2xl bg-white/[0.04] text-sm font-light text-muted-foreground",
          className
        )}
      >
        Log at least two prices to draw the trend.
      </div>
    );
  }

  const { pts, ticks, labelIdx, lowestIdx } = model;
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD.bottom} L ${pts[0].x.toFixed(1)} ${H - PAD.bottom} Z`;
  const hover = hoverIdx !== null ? pts[hoverIdx] : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHoverIdx(best);
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Price history line graph"
      >
        <defs>
          <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)" }} stopOpacity="0.28" />
            <stop offset="100%" style={{ stopColor: "var(--primary)" }} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="price-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--primary)" }} stopOpacity="0.75" />
            <stop offset="100%" style={{ stopColor: "var(--primary)" }} />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={t.y}
              x2={W - PAD.right}
              y2={t.y}
              stroke="rgba(233,244,241,0.09)"
              strokeWidth="1"
              strokeDasharray={i === ticks.length - 1 ? undefined : "3 5"}
            />
            <text
              x={PAD.left - 10}
              y={t.y + 3.5}
              textAnchor="end"
              fontSize="10.5"
              fontWeight="300"
              fill="rgba(233,244,241,0.45)"
            >
              {t.value >= 1000
                ? `$${(t.value / 1000).toFixed(t.value >= 10000 ? 0 : 1)}k`
                : `$${Math.round(t.value)}`}
            </text>
          </g>
        ))}

        {/* X date labels */}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={pts[i].x}
            y={H - PAD.bottom + 20}
            textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}
            fontSize="10.5"
            fontWeight="300"
            fill="rgba(233,244,241,0.45)"
          >
            {fmtDate(sorted[i].date)}
          </text>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#price-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#price-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover crosshair */}
        {hover && (
          <line
            x1={hover.x}
            y1={PAD.top}
            x2={hover.x}
            y2={H - PAD.bottom}
            stroke="rgba(233,244,241,0.22)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        )}

        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 5.5 : 3.5}
              fill={i === lowestIdx ? "#2fbf8a" : "#0f2529"}
              stroke={i === lowestIdx ? "#2fbf8a" : "var(--primary)"}
              strokeWidth="2"
              className="transition-all duration-150"
            />
          </g>
        ))}

        {/* Lowest marker label */}
        <g>
          <text
            x={pts[lowestIdx].x}
            y={pts[lowestIdx].y + 18}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="400"
            fill="#2fbf8a"
            letterSpacing="0.08em"
          >
            LOWEST
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-black/85 px-3 py-2 backdrop-blur"
          style={{
            left: `${(hover.x / W) * 100}%`,
            top: `${(hover.y / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <p className="whitespace-nowrap text-sm font-normal text-white tabular-nums">
            {formatMoney(hover.point.price)}
          </p>
          <p className="whitespace-nowrap text-[10.5px] font-light text-white/60">
            {fmtDate(hover.point.date, true)}
            {hover.point.note ? ` · ${hover.point.note}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
