"use client";

import { useState, type ReactNode } from "react";
import {
  Bath,
  BedDouble,
  Home,
  Maximize,
  Pencil,
  Plus,
  Ruler,
  Trash2,
  Wrench,
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
import { applianceAge, type Appliance, type HomeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

function ageTone(age: number) {
  if (age >= 15) return "bg-brand-orange/15 text-brand-orange";
  if (age >= 10) return "bg-brand-yellow/15 text-brand-yellow";
  return "bg-white/[0.07] text-muted-foreground";
}

export function HomeFacts() {
  const { db } = useHome();
  const info = db.homeInfo;
  const thisYear = new Date().getFullYear();

  const tiles: { icon: ReactNode; label: string; value: string; sub: string }[] = [
    {
      icon: <Ruler className="h-4 w-4" />,
      label: "Livable",
      value: info.livableSqft.toLocaleString(),
      sub: "sq ft finished",
    },
    {
      icon: <Maximize className="h-4 w-4" />,
      label: "Total",
      value: info.totalSqft.toLocaleString(),
      sub: "sq ft under roof",
    },
    {
      icon: <BedDouble className="h-4 w-4" />,
      label: "Bedrooms",
      value: String(info.bedrooms),
      sub: "rooms to rest",
    },
    {
      icon: <Bath className="h-4 w-4" />,
      label: "Bathrooms",
      value: String(info.bathrooms),
      sub: "full + half",
    },
  ];

  return (
    <section data-reveal className="glass rounded-[2rem] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Home className="h-4.5 w-4.5" />
          <h2 className="text-sm font-normal tracking-wide uppercase">Home facts</h2>
        </div>
        <HomeFactsDialog
          trigger={
            <Button variant="outline" className="glass-chip h-9 rounded-xl px-4 text-sm font-light">
              <Pencil className="h-3.5 w-3.5" />
              Edit facts
            </Button>
          }
        />
      </div>

      {/* Size + rooms */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl bg-white/[0.05] p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <span className="glass-chip flex h-7 w-7 items-center justify-center rounded-lg text-brand-cyan">
                {tile.icon}
              </span>
              <span className="text-[10.5px] font-light tracking-[0.12em] uppercase">
                {tile.label}
              </span>
            </div>
            <p className="text-display text-3xl">{tile.value}</p>
            <p className="mt-0.5 text-[11px] font-light text-muted-foreground">{tile.sub}</p>
          </div>
        ))}
      </div>

      {/* Appliances & systems */}
      <div className="mt-5">
        <p className="mb-3 flex items-center gap-2 text-[10.5px] font-light tracking-[0.16em] text-muted-foreground uppercase">
          <Wrench className="h-3.5 w-3.5" />
          Systems &amp; appliances — age at a glance
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {info.appliances.map((ap) => {
            const age = applianceAge(ap.installedYear);
            return (
              <div
                key={ap.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-normal">{ap.name}</p>
                  <p className="truncate text-[11px] font-light text-muted-foreground">
                    {ap.detail || `Installed ${ap.installedYear}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-normal tabular-nums",
                    ageTone(age)
                  )}
                  title={`Installed ${ap.installedYear}`}
                >
                  {ap.installedYear} · {age} yr{age === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
          {info.appliances.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-white/[0.03] px-5 py-5 text-center text-sm font-light text-muted-foreground sm:col-span-2 xl:col-span-3">
              Add your water heater, furnace, and friends — future-you will want
              to know how old they are.
            </p>
          )}
        </div>
        {info.appliances.some((a) => applianceAge(a.installedYear) >= 10) && (
          <p className="mt-3 text-[11px] font-light text-muted-foreground">
            Amber = 10+ years, orange = 15+ years — worth budgeting for a replacement.
          </p>
        )}
      </div>
      <span className="sr-only">as of {thisYear}</span>
    </section>
  );
}

function HomeFactsDialog({ trigger }: { trigger: ReactNode }) {
  const { db, updateHomeInfo } = useHome();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HomeInfo>(db.homeInfo);

  function handleOpenChange(next: boolean) {
    if (next) setForm(structuredClone(db.homeInfo));
    setOpen(next);
  }

  function setNum(key: keyof Omit<HomeInfo, "appliances">, raw: string) {
    setForm((f) => ({ ...f, [key]: Number(raw) || 0 }));
  }

  function setAppliance(id: string, patch: Partial<Appliance>) {
    setForm((f) => ({
      ...f,
      appliances: f.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }

  function addAppliance() {
    setForm((f) => ({
      ...f,
      appliances: [
        ...f.appliances,
        {
          id: `ap-${Date.now().toString(36)}`,
          name: "",
          detail: "",
          installedYear: new Date().getFullYear(),
        },
      ],
    }));
  }

  function removeAppliance(id: string) {
    setForm((f) => ({ ...f, appliances: f.appliances.filter((a) => a.id !== id) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateHomeInfo({
      ...form,
      appliances: form.appliances.filter((a) => a.name.trim()),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extralight">Edit home facts</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-light">Livable sq ft</Label>
              <Input
                type="number"
                min="0"
                value={form.livableSqft || ""}
                onChange={(e) => setNum("livableSqft", e.target.value)}
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-light">Total sq ft</Label>
              <Input
                type="number"
                min="0"
                value={form.totalSqft || ""}
                onChange={(e) => setNum("totalSqft", e.target.value)}
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-light">Bedrooms</Label>
              <Input
                type="number"
                min="0"
                value={form.bedrooms || ""}
                onChange={(e) => setNum("bedrooms", e.target.value)}
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-light">Bathrooms</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={form.bathrooms || ""}
                onChange={(e) => setNum("bathrooms", e.target.value)}
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="font-light">Systems &amp; appliances</Label>
              <Button
                type="button"
                variant="outline"
                onClick={addAppliance}
                className="glass-chip h-8 rounded-lg px-3 text-xs font-light"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-2.5">
              {form.appliances.map((ap) => (
                <div key={ap.id} className="rounded-2xl bg-white/[0.04] p-3">
                  <div className="flex gap-2">
                    <Input
                      value={ap.name}
                      onChange={(e) => setAppliance(ap.id, { name: e.target.value })}
                      placeholder="Water heater"
                      className="glass-chip h-10 rounded-lg font-light"
                    />
                    <Input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={ap.installedYear || ""}
                      onChange={(e) =>
                        setAppliance(ap.id, { installedYear: Number(e.target.value) || 0 })
                      }
                      placeholder="Year"
                      className="glass-chip h-10 w-24 shrink-0 rounded-lg font-light"
                    />
                    <button
                      type="button"
                      onClick={() => removeAppliance(ap.id)}
                      aria-label={`Remove ${ap.name || "appliance"}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-white/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    value={ap.detail ?? ""}
                    onChange={(e) => setAppliance(ap.id, { detail: e.target.value })}
                    placeholder="Make / model / spec (optional)"
                    className="glass-chip mt-2 h-10 rounded-lg font-light"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="h-11 w-full rounded-xl font-light">
            Save home facts
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
