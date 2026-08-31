"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, Move3d, X } from "lucide-react";
import { Reveal } from "@/components/anim";
import { StatusBadge } from "@/components/project-bits";
import { Progress } from "@/components/ui/progress";
import { useHome } from "@/lib/data-context";
import { STATUS_LABEL, formatMoney, type ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const HouseScene = dynamic(() => import("@/components/house/house-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm font-light text-muted-foreground">
      Framing the house…
    </div>
  ),
});

const LEGEND: { status: ProjectStatus; color: string }[] = [
  { status: "idea", color: "#9aa7b5" },
  { status: "planned", color: "#ffdc26" },
  { status: "in_progress", color: "#ff9a5c" },
  { status: "done", color: "#3cdbc8" },
];

export default function HousePage() {
  const { db } = useHome();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const marked = useMemo(() => db.projects.filter((p) => p.hotspot), [db.projects]);
  const selected = marked.find((p) => p.id === selectedId) ?? null;
  const category = selected
    ? db.categories.find((c) => c.id === selected.categoryId)
    : null;

  return (
    <Reveal className="space-y-5">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
            The Eaton residence
          </p>
          <h1 className="text-display mt-1 text-4xl sm:text-5xl">3D House</h1>
        </div>
        <div className="glass-chip flex items-center gap-2 rounded-full px-4 py-2 text-xs font-light text-muted-foreground">
          <Move3d className="h-4 w-4 text-brand-cyan" />
          Drag to orbit · scroll to zoom · tap a dot for details
        </div>
      </div>

      <div data-reveal className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* Scene */}
        <section className="glass-deep relative h-[420px] overflow-hidden rounded-[2rem] sm:h-[560px]">
          <HouseScene
            projects={marked}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          />

          {/* Legend */}
          <div className="glass-chip absolute left-4 top-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-2.5">
            {LEGEND.map(({ status, color }) => (
              <span key={status} className="flex items-center gap-1.5 text-[11px] font-light">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {STATUS_LABEL[status]}
              </span>
            ))}
          </div>

          {/* Selected project overlay */}
          {selected && (
            <div className="glass absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-3xl p-4 sm:inset-x-auto sm:right-4 sm:w-[340px]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-[11px] font-light text-muted-foreground">
                    #{selected.rank} · {category?.name}
                  </span>
                </div>
                <p className="mt-1.5 truncate font-normal">{selected.title}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={selected.progress} className="h-1.5 flex-1" />
                  <span className="text-sm font-light tabular-nums">
                    {formatMoney(selected.estimatedCost)}
                  </span>
                </div>
                <Link
                  href={`/projects/${selected.id}`}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-light text-brand-cyan hover:underline"
                >
                  Open project
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                className="glass-chip flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Marker index */}
        <section className="glass flex max-h-[560px] flex-col rounded-[2rem] p-6">
          <h2 className="text-xl font-light">Around the house</h2>
          <p className="mb-4 text-sm font-light text-muted-foreground">
            {marked.length} spots marked on the model
          </p>
          <div className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
            {[...marked]
              .sort((a, b) => a.rank - b.rank)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/[0.05] px-4 py-3 text-left transition-all hover:bg-white/[0.09]",
                    selectedId === p.id && "border-brand-cyan/40 bg-white/[0.09] ring-glow"
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: LEGEND.find((l) => l.status === p.status)?.color,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-normal">{p.title}</span>
                    <span className="block text-xs font-light text-muted-foreground">
                      {db.categories.find((c) => c.id === p.categoryId)?.name}
                    </span>
                  </span>
                  <span className="text-sm font-light tabular-nums">
                    {formatMoney(p.estimatedCost)}
                  </span>
                </button>
              ))}
          </div>
        </section>
      </div>
    </Reveal>
  );
}
