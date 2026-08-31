"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Check,
  History,
  House,
  MessageSquare,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/anim";
import { useHome } from "@/lib/data-context";
import {
  ACTIVITY_VERB,
  HOUSEHOLD_MEMBERS,
  timeAgo,
  type ActivityAction,
  type ActivityEntry,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTION_ICON: Record<ActivityAction, LucideIcon> = {
  added_project: Plus,
  updated_project: Pencil,
  changed_priority: ArrowDownUp,
  changed_status: RefreshCw,
  logged_price: Tag,
  completed_task: Check,
  updated_budget: PiggyBank,
  updated_home: House,
  added_note: MessageSquare,
  deleted_note: Trash2,
};

const ACTION_TINT: Partial<Record<ActivityAction, string>> = {
  added_project: "bg-brand-cyan/12 text-brand-cyan",
  completed_task: "bg-brand-green/12 text-brand-green",
  logged_price: "bg-brand-yellow/12 text-brand-yellow",
  changed_priority: "bg-brand-orange/12 text-brand-orange",
};

function avatarColor(actor: string) {
  if (actor === "Melanie") return "bg-brand-green text-brand-ink";
  if (actor === "Nate") return "bg-brand-orange text-brand-ink";
  return "bg-secondary text-secondary-foreground";
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ChangelogPage() {
  const { db } = useHome();
  const [who, setWho] = useState<string>("all");

  const groups = useMemo(() => {
    const list = (db.activity ?? [])
      .filter((a) => who === "all" || a.actor === who)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const byDay = new Map<string, ActivityEntry[]>();
    for (const entry of list) {
      const key = dayLabel(entry.createdAt);
      const bucket = byDay.get(key);
      if (bucket) bucket.push(entry);
      else byDay.set(key, [entry]);
    }
    return [...byDay.entries()];
  }, [db.activity, who]);

  return (
    <Reveal className="space-y-5">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
            Who did what, when
          </p>
          <h1 className="text-display mt-1 text-4xl sm:text-5xl">Change Log</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...HOUSEHOLD_MEMBERS].map((m) => (
            <button
              key={m}
              onClick={() => setWho(m)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-light capitalize transition-all",
                who === m
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "glass-chip text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "all" ? "Everyone" : m}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div data-reveal className="glass rounded-[1.75rem] p-10 text-center">
          <History className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.25} />
          <p className="mt-3 text-sm font-light text-muted-foreground">
            No changes yet{who !== "all" ? ` from ${who}` : ""} — the log fills in as you
            add projects, re-rank priorities, log prices, and check off home care.
          </p>
        </div>
      ) : (
        groups.map(([day, entries]) => (
          <section key={day} data-reveal className="glass rounded-[1.75rem] p-4 sm:p-6">
            <h2 className="mb-3 px-1 text-xs font-normal tracking-[0.2em] text-muted-foreground uppercase">
              {day}
            </h2>
            <div className="space-y-2">
              {entries.map((entry) => {
                const Icon = ACTION_ICON[entry.action] ?? Pencil;
                const body = (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-medium",
                        avatarColor(entry.actor)
                      )}
                    >
                      {entry.actor[0] ?? "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-light leading-snug">
                        <span className="font-normal">{entry.actor}</span>{" "}
                        {ACTIVITY_VERB[entry.action] ?? "changed"}{" "}
                        <span className={cn("font-normal", entry.targetId && "underline decoration-white/25 underline-offset-2")}>
                          {entry.targetTitle}
                        </span>
                        {entry.detail && (
                          <span className="text-muted-foreground"> — {entry.detail}</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-light text-muted-foreground">
                        {timeAgo(entry.createdAt)}
                        {" · "}
                        {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        ACTION_TINT[entry.action] ?? "bg-white/[0.06] text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </span>
                  </>
                );
                const rowClass =
                  "flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] px-3.5 py-3 text-left transition-colors sm:gap-4 sm:px-4";
                return entry.targetId ? (
                  <Link
                    key={entry.id}
                    href={`/projects/${entry.targetId}`}
                    className={cn(rowClass, "hover:bg-white/[0.09]")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={entry.id} className={rowClass}>
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </Reveal>
  );
}
