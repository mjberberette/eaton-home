"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Banknote, CalendarRange, PiggyBank, Wallet } from "lucide-react";
import { CountUp, Reveal } from "@/components/anim";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHome } from "@/lib/data-context";
import { formatMoney } from "@/lib/types";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-brand-cyan",
  "bg-brand-yellow",
  "bg-brand-orange",
  "bg-teal-400",
  "bg-amber-300",
  "bg-orange-300",
  "bg-cyan-300",
  "bg-lime-300",
  "bg-rose-300",
  "bg-violet-300",
  "bg-sky-300",
];

export default function BudgetPage() {
  const { db, updateBudget } = useHome();
  const { projects, categories, budget } = db;

  const open = projects.filter((p) => p.status !== "done");
  const committed = open.reduce((s, p) => s + (p.estimatedCost - p.spent), 0);
  const spent = projects.reduce((s, p) => s + p.spent, 0);
  const monthsToFund =
    budget.monthlyBudget > 0
      ? Math.max(0, Math.ceil((committed - budget.projectFund) / budget.monthlyBudget))
      : null;

  const byCategory = useMemo(() => {
    const rows = categories
      .map((cat) => {
        const items = open.filter((p) => p.categoryId === cat.id);
        return {
          cat,
          total: items.reduce((s, p) => s + (p.estimatedCost - p.spent), 0),
          count: items.length,
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
    const max = rows[0]?.total ?? 1;
    return { rows, max };
  }, [categories, open]);

  return (
    <Reveal className="space-y-5">
      <div data-reveal className="px-1">
        <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
          Where the money flows
        </p>
        <h1 className="text-display mt-1 text-4xl sm:text-5xl">Budget</h1>
      </div>

      {/* Headline numbers */}
      <div data-reveal className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs font-light tracking-wide uppercase">Project fund</span>
          </div>
          <CountUp value={budget.projectFund} prefix="$" className="text-display text-4xl" />
          <p className="mt-1 text-xs font-light text-muted-foreground">saved and ready</p>
        </div>
        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-light tracking-wide uppercase">Still to fund</span>
          </div>
          <CountUp value={committed} prefix="$" className="text-display text-4xl" />
          <p className="mt-1 text-xs font-light text-muted-foreground">
            open wishlist, minus what&apos;s spent
          </p>
        </div>
        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span className="text-xs font-light tracking-wide uppercase">Invested so far</span>
          </div>
          <CountUp value={spent} prefix="$" className="text-display text-4xl" />
          <p className="mt-1 text-xs font-light text-muted-foreground">across all projects</p>
        </div>
        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            <span className="text-xs font-light tracking-wide uppercase">Runway</span>
          </div>
          {monthsToFund === null ? (
            <span className="text-display text-4xl">—</span>
          ) : monthsToFund === 0 ? (
            <span className="text-display text-4xl text-brand-cyan">Funded</span>
          ) : (
            <CountUp value={monthsToFund} suffix=" mo" className="text-display text-4xl" />
          )}
          <p className="mt-1 text-xs font-light text-muted-foreground">
            at {formatMoney(budget.monthlyBudget)}/month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Category breakdown */}
        <section data-reveal className="glass rounded-[1.75rem] p-6">
          <h2 className="mb-1 text-xl font-light">Wishlist by category</h2>
          <p className="mb-6 text-sm font-light text-muted-foreground">
            Remaining cost of open projects in each part of the house
          </p>
          <div className="space-y-4">
            {byCategory.rows.map(({ cat, total, count }, i) => (
              <Link
                key={cat.id}
                href="/projects"
                className="group block"
              >
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-normal group-hover:underline">
                    {cat.name}
                    <span className="ml-2 text-xs font-light text-muted-foreground">
                      {count} project{count > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="font-light tabular-nums">{formatMoney(total)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      BAR_COLORS[i % BAR_COLORS.length]
                    )}
                    style={{ width: `${Math.max(4, (total / byCategory.max) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
            {byCategory.rows.length === 0 && (
              <p className="text-sm font-light text-muted-foreground">
                Nothing left to fund — add a new dream on the{" "}
                <Link href="/projects" className="text-brand-cyan hover:underline">
                  projects page
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        {/* Settings */}
        <section data-reveal className="glass h-fit rounded-[1.75rem] p-6">
          <h2 className="mb-1 text-xl font-light">Budget settings</h2>
          <p className="mb-6 text-sm font-light text-muted-foreground">
            Tune the plan — everything else recalculates
          </p>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="font-light">Monthly home budget ($)</Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={budget.monthlyBudget || ""}
                onChange={(e) => updateBudget({ monthlyBudget: Number(e.target.value) || 0 })}
                className="glass-chip h-12 rounded-xl text-lg font-light"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-light">Current project fund ($)</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={budget.projectFund || ""}
                onChange={(e) => updateBudget({ projectFund: Number(e.target.value) || 0 })}
                className="glass-chip h-12 rounded-xl text-lg font-light"
              />
            </div>
            <div className="rounded-2xl bg-brand-cyan/10 p-4 text-sm font-light leading-relaxed text-teal-100">
              {monthsToFund === 0 ? (
                <>The fund already covers the whole open wishlist. Time to build.</>
              ) : monthsToFund !== null ? (
                <>
                  Saving {formatMoney(budget.monthlyBudget)} a month, the full wishlist is funded
                  in about <span className="font-normal">{monthsToFund} months</span>.
                </>
              ) : (
                <>Set a monthly budget to see the funding runway.</>
              )}
            </div>
            <Link
              href="/projects"
              className="flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3 text-sm font-light transition-colors hover:bg-white/[0.09]"
            >
              Reprioritize the list to fit the budget
              <ArrowUpRight className="h-4 w-4 text-brand-cyan" />
            </Link>
          </div>
        </section>
      </div>
    </Reveal>
  );
}
