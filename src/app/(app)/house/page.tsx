"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarClock,
  Move3d,
  X,
} from "lucide-react";
import { Reveal } from "@/components/anim";
import { HomeFacts } from "@/components/home-facts";
import { categoryMeta } from "@/lib/category-meta";
import { StatusBadge } from "@/components/project-bits";
import { Progress } from "@/components/ui/progress";
import { useHome } from "@/lib/data-context";
import {
  STATUS_LABEL,
  daysUntilDue,
  formatMoney,
  type Project,
  type ProjectStatus,
} from "@/lib/types";
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

  const alerts = useMemo(
    () =>
      db.tasks
        .map((task) => ({ task, days: daysUntilDue(task) }))
        .filter(({ days }) => days <= 14)
        .sort((a, b) => a.days - b.days)
        .slice(0, 4),
    [db.tasks]
  );

  const openSpend = db.projects
    .filter((p) => p.status !== "done")
    .reduce((s, p) => s + (p.estimatedCost - p.spent), 0);

  return (
    <Reveal className="space-y-5">
      {/* Immersive hero */}
      <section
        data-reveal
        className="glass-deep relative h-[calc(100dvh-7.5rem)] min-h-[560px] overflow-hidden rounded-[2rem]"
      >
        <HouseScene
          projects={marked}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
        />

        {/* Title block */}
        <div className="pointer-events-none absolute left-6 top-6">
          <p className="text-[11px] font-light tracking-[0.32em] text-white/50 uppercase">
            The Eaton residence
          </p>
          <h1 className="text-display mt-1 text-3xl text-white sm:text-4xl">
            Around the house
          </h1>
          <div className="pointer-events-auto mt-3 inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl">
            {LEGEND.map(({ status, color }) => (
              <span
                key={status}
                className="flex items-center gap-1.5 text-[11px] font-light text-white/70"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {STATUS_LABEL[status]}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] font-light text-white/40">
            Marker icon = area of the house · dot = status
          </p>
        </div>

        {/* Orbit hint */}
        <div className="glass-chip absolute right-6 top-6 hidden items-center gap-2 rounded-full px-4 py-2 text-xs font-light text-white/70 sm:flex">
          <Move3d className="h-4 w-4 text-brand-cyan" />
          Drag to orbit · scroll to zoom · tap a dot
        </div>

        {/* Left floating panel — marker index */}
        <div className="glass absolute bottom-6 left-6 top-[132px] hidden w-[300px] flex-col rounded-3xl p-5 lg:flex">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-light">Upgrade markers</h2>
            <span className="text-[11px] font-light text-muted-foreground">
              {marked.length} placed
            </span>
          </div>
          <div className="-mr-2 flex-1 space-y-1.5 overflow-y-auto pr-2">
            {[...marked]
              .sort((a, b) => a.rank - b.rank)
              .map((p) => (
                <MarkerRow
                  key={p.id}
                  project={p}
                  active={selectedId === p.id}
                  onClick={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
                />
              ))}
          </div>
          <div className="mt-3 border-t border-white/10 pt-3 text-[11px] font-light text-muted-foreground">
            {formatMoney(openSpend)} of work still on the wishlist
          </div>
        </div>

        {/* Right floating alerts */}
        <div className="absolute bottom-6 right-6 hidden w-[240px] flex-col gap-2.5 md:flex">
          {alerts.map(({ task, days }) => (
            <Link
              key={task.id}
              href="/tasks"
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition-transform hover:-translate-y-0.5"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  days <= 0
                    ? "bg-destructive/15 text-destructive"
                    : days <= 7
                      ? "bg-brand-orange/15 text-brand-orange"
                      : "bg-brand-cyan/12 text-brand-cyan"
                )}
              >
                {days <= 0 ? (
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                ) : days <= 7 ? (
                  <BellRing className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-normal text-white">
                  {task.name}
                </span>
                <span
                  className={cn(
                    "block text-[11px] font-light",
                    days <= 0 ? "text-destructive" : "text-white/55"
                  )}
                >
                  {days <= 0 ? `${Math.abs(days)}d overdue` : `due in ${days}d`}
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* Selected project overlay */}
        {selected && (
          <div className="glass absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-3xl p-4 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[360px] sm:-translate-x-1/2 lg:translate-x-[calc(-50%+90px)]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="text-[11px] font-light text-muted-foreground">
                  #{selected.rank} ·{" "}
                  {db.categories.find((c) => c.id === selected.categoryId)?.name}
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

      {/* Home facts: size, rooms, and appliance ages */}
      <HomeFacts />

      {/* Mobile fallback: marker list below the scene */}
      <section data-reveal className="glass rounded-[2rem] p-5 lg:hidden">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-light">Upgrade markers</h2>
          <span className="text-xs font-light text-muted-foreground">{marked.length} placed</span>
        </div>
        <div className="space-y-1.5">
          {[...marked]
            .sort((a, b) => a.rank - b.rank)
            .map((p) => (
              <MarkerRow
                key={p.id}
                project={p}
                active={selectedId === p.id}
                onClick={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
              />
            ))}
        </div>
      </section>
    </Reveal>
  );
}

function MarkerRow({
  project,
  active,
  onClick,
}: {
  project: Project;
  active: boolean;
  onClick: () => void;
}) {
  const meta = categoryMeta(project.categoryId);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/[0.05] px-3.5 py-2.5 text-left transition-all hover:bg-white/[0.09]",
        active && "border-brand-cyan/40 bg-white/[0.09]"
      )}
    >
      <span className="relative shrink-0">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60"
          style={{ background: meta.pastel }}
        >
          <meta.icon className="h-3.5 w-3.5 text-neutral-800" strokeWidth={2} />
        </span>
        <span
          className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border border-white/80"
          style={{ background: LEGEND.find((l) => l.status === project.status)?.color }}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-normal">{project.title}</span>
        <span className="block text-[11px] font-light text-muted-foreground">
          Priority #{project.rank}
        </span>
      </span>
      <span className="text-xs font-light tabular-nums text-white/70">
        {formatMoney(project.estimatedCost)}
      </span>
    </button>
  );
}
