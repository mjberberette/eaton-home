"use client";

import {
  BatteryCharging,
  Check,
  Droplets,
  Fan,
  Filter,
  Flame,
  House,
  Leaf,
  Wrench,
} from "lucide-react";
import { Reveal } from "@/components/anim";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHome } from "@/lib/data-context";
import { daysUntilDue, type RecurringTask } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<RecurringTask["icon"], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  filter: Filter,
  droplets: Droplets,
  wind: Fan,
  flame: Flame,
  leaf: Leaf,
  battery: BatteryCharging,
  wrench: Wrench,
  home: House,
};

export default function TasksPage() {
  const { db, completeTask } = useHome();
  const items = db.tasks
    .map((task) => ({ task, days: daysUntilDue(task) }))
    .sort((a, b) => a.days - b.days);
  const overdue = items.filter((i) => i.days <= 0).length;

  return (
    <Reveal className="space-y-5">
      <div data-reveal className="px-1">
        <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
          The rhythm of the house
        </p>
        <h1 className="text-display mt-1 text-4xl sm:text-5xl">Home care</h1>
        <p className="mt-2 max-w-xl text-sm font-light text-muted-foreground">
          Filters, batteries, and the quiet chores that keep everything humming.
          {overdue > 0
            ? ` ${overdue} ${overdue === 1 ? "task is" : "tasks are"} overdue — the house is politely clearing its throat.`
            : " Everything is on schedule."}
        </p>
      </div>

      <div data-reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ task, days }) => {
          const Icon = ICONS[task.icon];
          const cycleUsed = Math.min(
            100,
            Math.max(0, Math.round(((task.intervalDays - days) / task.intervalDays) * 100))
          );
          const urgent = days <= 0;
          const soon = days > 0 && days <= 7;

          return (
            <div
              key={task.id}
              className={cn(
                "glass flex flex-col rounded-[1.75rem] p-6 transition-shadow hover:shadow-xl",
                urgent && "ring-1 ring-destructive/40"
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl",
                    urgent
                      ? "bg-destructive/15 text-destructive"
                      : soon
                        ? "bg-brand-orange/15 text-orange-200"
                        : "bg-brand-cyan/12 text-teal-200"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-normal",
                    urgent
                      ? "bg-destructive/15 text-destructive"
                      : soon
                        ? "bg-brand-orange/15 text-orange-200"
                        : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {urgent ? `${Math.abs(days)}d overdue` : `due in ${days}d`}
                </span>
              </div>

              <h2 className="font-normal">{task.name}</h2>
              {task.detail && (
                <p className="mt-0.5 text-xs font-light text-muted-foreground">{task.detail}</p>
              )}

              <div className="mt-4 space-y-1.5">
                <Progress
                  value={cycleUsed}
                  className={cn("h-1.5", urgent && "[&>div]:bg-destructive")}
                />
                <p className="text-[11px] font-light text-muted-foreground">
                  every {task.intervalDays} days · last done{" "}
                  {new Date(task.lastDone + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => completeTask(task.id)}
                className="glass-chip mt-5 h-10 rounded-xl font-light"
              >
                <Check className="h-4 w-4 text-brand-cyan" />
                Mark done today
              </Button>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}
