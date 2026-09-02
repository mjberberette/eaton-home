"use client";

import { useState, type ReactNode } from "react";
import {
  BatteryCharging,
  Droplets,
  Fan,
  Filter,
  Flame,
  House,
  Leaf,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHome } from "@/lib/data-context";
import type { RecurringTask } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON_OPTIONS: { id: RecurringTask["icon"]; icon: LucideIcon; label: string }[] = [
  { id: "wind", icon: Fan, label: "Air" },
  { id: "droplets", icon: Droplets, label: "Water" },
  { id: "filter", icon: Filter, label: "Filter" },
  { id: "flame", icon: Flame, label: "Heat" },
  { id: "leaf", icon: Leaf, label: "Yard" },
  { id: "battery", icon: BatteryCharging, label: "Battery" },
  { id: "wrench", icon: Wrench, label: "Fix" },
  { id: "home", icon: House, label: "House" },
];

const INTERVAL_PRESETS = [30, 45, 90, 180, 365];

/** Create or edit a recurring home-care task. */
export function TaskFormDialog({
  task,
  trigger,
}: {
  /** Omit for create mode */
  task?: RecurringTask;
  trigger: ReactNode;
}) {
  const { addTask, updateTask } = useHome();
  const editing = Boolean(task);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [interval, setInterval] = useState("90");
  const [lastDone, setLastDone] = useState("");
  const [icon, setIcon] = useState<RecurringTask["icon"]>("wrench");

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(task?.name ?? "");
      setDetail(task?.detail ?? "");
      setInterval(String(task?.intervalDays ?? 90));
      setLastDone(task?.lastDone ?? new Date().toISOString().slice(0, 10));
      setIcon(task?.icon ?? "wrench");
    }
    setOpen(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      detail: detail.trim() || undefined,
      intervalDays: Math.max(1, Math.round(Number(interval)) || 90),
      lastDone: lastDone || new Date().toISOString().slice(0, 10),
      icon,
    };
    if (task) updateTask(task.id, payload);
    else addTask(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass max-h-[90vh] max-w-md overflow-y-auto rounded-3xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extralight">
            {editing ? "Edit task" : "Add a home care task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-light">Task</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Replace furnace filter"
              className="glass-chip h-11 rounded-xl font-light"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-light">Details (size, model, where…)</Label>
            <Input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="20×25×1 MERV 13 — furnace closet"
              className="glass-chip h-11 rounded-xl font-light"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-light">Repeat every (days)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="glass-chip h-11 w-24 shrink-0 rounded-xl font-light"
              />
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {INTERVAL_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setInterval(String(d))}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-light transition-colors",
                      Number(interval) === d
                        ? "bg-primary text-primary-foreground"
                        : "glass-chip text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-light">Last done</Label>
            <Input
              type="date"
              value={lastDone}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setLastDone(e.target.value)}
              className="glass-chip h-11 rounded-xl font-light"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-light">Icon</Label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIcon(opt.id)}
                  aria-label={opt.label}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all",
                    icon === opt.id
                      ? "border-brand-cyan/60 bg-white/[0.08] ring-glow"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  )}
                >
                  <opt.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                  <span className="text-[10px] font-light text-muted-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl font-light">
            {editing ? "Save task" : "Add task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
