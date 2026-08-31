"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Hammer,
  PiggyBank,
  Tag,
  TrendingDown,
} from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { CountUp, Reveal } from "@/components/anim";
import { Sparkline, StatusBadge, TrendChip, priceTrend } from "@/components/project-bits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useHome } from "@/lib/data-context";
import { daysUntilDue, formatMoney } from "@/lib/types";

const HouseScene = dynamic(() => import("@/components/house/house-scene"), { ssr: false });

export default function DashboardPage() {
  const { db, userName } = useHome();
  const { projects, tasks, budget, categories } = db;

  const active = projects.filter((p) => p.status === "in_progress");
  const notDone = projects.filter((p) => p.status !== "done");
  const remainingCost = notDone.reduce((sum, p) => sum + (p.estimatedCost - p.spent), 0);
  const dueSoon = tasks
    .map((t) => ({ task: t, days: daysUntilDue(t) }))
    .filter(({ days }) => days <= 14)
    .sort((a, b) => a.days - b.days);
  const topPriorities = [...projects]
    .filter((p) => p.status !== "done")
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);
  const bestBuy = [...projects]
    .filter((p) => p.status !== "done" && p.priceHistory.length >= 2)
    .sort((a, b) => priceTrend(a.priceHistory).pct - priceTrend(b.priceHistory).pct)[0];
  const spentThisSeason = projects.reduce((sum, p) => sum + p.spent, 0);
  const fundUsedPct = Math.min(100, Math.round((spentThisSeason / (budget.projectFund + spentThisSeason)) * 100));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "";

  return (
    <Reveal className="space-y-5">
      {/* Header */}
      {/* The logo intentionally sits outside the fade-in targets so its
          draw-on animation is fully visible while the header fades in. */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div className="flex items-center gap-4 sm:gap-5">
          <AnimatedLogo width={58} className="shrink-0" />
          <div data-reveal>
            <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="text-display mt-1 text-4xl sm:text-5xl">
              {greeting}, <span className="font-normal">{userName}</span>
            </h1>
          </div>
        </div>
        <Button asChild data-reveal className="h-11 rounded-2xl px-5 font-light">
          <Link href="/projects">
            Open priority list
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div data-reveal className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={<Hammer className="h-4.5 w-4.5" />}
          label="Active projects"
          value={<CountUp value={active.length} className="text-display text-4xl" />}
          sub={`${notDone.length} on the list`}
        />
        <StatCard
          icon={<Tag className="h-4.5 w-4.5" />}
          label="Planned spend left"
          value={<CountUp value={remainingCost} prefix="$" className="text-display text-4xl" />}
          sub="across open projects"
        />
        <StatCard
          icon={<PiggyBank className="h-4.5 w-4.5" />}
          label="Project fund"
          value={<CountUp value={budget.projectFund} prefix="$" className="text-display text-4xl" />}
          sub={`${fundUsedPct}% invested so far`}
        />
        <StatCard
          icon={<CalendarCheck className="h-4.5 w-4.5" />}
          label="Care due soon"
          value={<CountUp value={dueSoon.length} className="text-display text-4xl" />}
          sub="within two weeks"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* Priority list */}
        <section data-reveal className="glass rounded-[1.75rem] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light">Top priorities</h2>
              <p className="text-sm font-light text-muted-foreground">
                The master list, ranked by what matters most
              </p>
            </div>
            <Link
              href="/projects"
              className="glass-chip flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label="All projects"
            >
              <ArrowUpRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {topPriorities.map((p, i) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-transparent bg-white/[0.05] px-4 py-3.5 transition-all hover:border-brand-cyan/25 hover:bg-white/[0.09]"
              >
                <span
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm " +
                    (i === 0
                      ? "bg-brand-yellow font-medium text-brand-ink"
                      : "bg-secondary font-light text-secondary-foreground")
                  }
                >
                  {p.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-normal">{p.title}</p>
                  <p className="text-xs font-light text-muted-foreground">
                    {categoryName(p.categoryId)}
                  </p>
                </div>
                <div className="hidden w-28 sm:block">
                  <Progress value={p.progress} className="h-1.5" />
                </div>
                <TrendChip history={p.priceHistory} className="hidden md:inline-flex" />
                <span className="w-20 text-right font-light tabular-nums">
                  {formatMoney(p.estimatedCost)}
                </span>
                <StatusBadge status={p.status} className="hidden lg:inline-flex" />
              </Link>
            ))}
          </div>
        </section>

        {/* Right rail */}
        <div className="flex flex-col gap-5">
          {/* 3D house teaser */}
          <section
            data-reveal
            className="glass-deep group relative h-[260px] overflow-hidden rounded-[1.75rem]"
          >
            <HouseScene projects={[]} autoRotate interactive={false} />
            <Link
              href="/house"
              className="absolute inset-0 flex flex-col justify-between p-5"
              aria-label="Open the 3D house"
            >
              <span className="glass-chip self-start rounded-full px-3.5 py-1.5 text-[11px] font-light tracking-[0.2em] text-foreground uppercase">
                3D House
              </span>
              <span className="flex items-center justify-between text-white">
                <span>
                  <span className="block text-lg font-extralight">Walk around the house</span>
                  <span className="block text-xs font-light text-white/60">
                    {projects.filter((p) => p.hotspot && p.status !== "done").length} upgrade markers
                    placed
                  </span>
                </span>
                <span className="glass-chip flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-4.5 w-4.5" />
                </span>
              </span>
            </Link>
          </section>

          {/* Price watch */}
          {bestBuy && (
            <section data-reveal className="glass rounded-[1.75rem] p-6">
              <div className="mb-3 flex items-center gap-2 text-brand-cyan">
                <TrendingDown className="h-4.5 w-4.5" />
                <h2 className="text-sm font-normal tracking-wide uppercase">Price watch</h2>
              </div>
              <Link href={`/projects/${bestBuy.id}`} className="group block">
                <p className="font-normal group-hover:underline">{bestBuy.title}</p>
                <p className="mt-0.5 text-xs font-light text-muted-foreground">
                  Down {Math.abs(priceTrend(bestBuy.priceHistory).pct).toFixed(1)}% since tracking
                  began — good time to buy
                </p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <Sparkline
                    history={bestBuy.priceHistory}
                    className="h-11 w-full text-brand-cyan"
                    stroke="currentColor"
                  />
                  <span className="text-display text-2xl whitespace-nowrap">
                    {formatMoney(bestBuy.estimatedCost)}
                  </span>
                </div>
              </Link>
            </section>
          )}

          {/* Care due soon */}
          <section data-reveal className="glass rounded-[1.75rem] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-normal tracking-wide text-muted-foreground uppercase">
                Home care up next
              </h2>
              <Link
                href="/tasks"
                className="text-xs font-light text-brand-cyan hover:underline"
              >
                All tasks
              </Link>
            </div>
            <div className="space-y-3">
              {dueSoon.slice(0, 3).map(({ task, days }) => (
                <div key={task.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-normal">{task.name}</p>
                    <p className="text-xs font-light text-muted-foreground">
                      every {task.intervalDays} days
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-3 py-1 text-[11px] font-normal " +
                      (days <= 0
                        ? "bg-destructive/15 text-destructive"
                        : days <= 7
                          ? "bg-brand-orange/15 text-orange-200"
                          : "bg-secondary text-secondary-foreground")
                    }
                  >
                    {days <= 0 ? "Overdue" : `${days}d`}
                  </span>
                </div>
              ))}
              {dueSoon.length === 0 && (
                <p className="text-sm font-light text-muted-foreground">
                  Nothing due in the next two weeks. The house thanks you.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </Reveal>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="glass rounded-[1.75rem] p-5">
      <div className="mb-4 flex items-center gap-2.5 text-muted-foreground">
        <span className="glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-foreground">
          {icon}
        </span>
        <span className="text-xs font-light tracking-wide uppercase">{label}</span>
      </div>
      {value}
      <p className="mt-1 text-xs font-light text-muted-foreground">{sub}</p>
    </div>
  );
}
