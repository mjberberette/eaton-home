"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronUp, ImageIcon, Plus } from "lucide-react";
import { Reveal } from "@/components/anim";
import { StatusBadge, TrendChip } from "@/components/project-bits";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHome } from "@/lib/data-context";
import { formatMoney, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { db, moveRank, addProject } = useHome();
  const { projects, categories } = db;
  const [zone, setZone] = useState<"all" | "outdoor" | "indoor" | "repairs">("all");

  const ranked = useMemo(() => [...projects].sort((a, b) => a.rank - b.rank), [projects]);
  const filteredCategories = categories.filter((c) => zone === "all" || c.zone === zone);

  return (
    <Reveal className="space-y-5">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
            Upgrades &amp; wishes
          </p>
          <h1 className="text-display mt-1 text-4xl sm:text-5xl">Projects</h1>
        </div>
        <AddProjectDialog
          onAdd={addProject}
          categories={categories}
          nextRank={projects.length + 1}
        />
      </div>

      <Tabs defaultValue="priority" data-reveal>
        <TabsList className="glass-chip h-12 rounded-2xl p-1.5">
          <TabsTrigger value="priority" className="rounded-xl px-5 font-light">
            Master priority list
          </TabsTrigger>
          <TabsTrigger value="category" className="rounded-xl px-5 font-light">
            By category
          </TabsTrigger>
        </TabsList>

        {/* ---- Master priority list ---- */}
        <TabsContent value="priority" className="mt-5">
          <div className="glass rounded-[1.75rem] p-4 sm:p-6">
            <div className="space-y-2.5">
              {ranked.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-transparent bg-white/[0.05] px-3 py-3 transition-all hover:border-brand-cyan/25 hover:bg-white/[0.09] sm:gap-4 sm:px-4",
                    p.status === "done" && "opacity-55"
                  )}
                >
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveRank(p.id, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${p.title} up`}
                      className="text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveRank(p.id, 1)}
                      disabled={i === ranked.length - 1}
                      aria-label={`Move ${p.title} down`}
                      className="text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm",
                      i === 0
                        ? "bg-brand-yellow font-medium text-brand-ink"
                        : "bg-secondary font-light"
                    )}
                  >
                    {p.rank}
                  </span>
                  <Link href={`/projects/${p.id}`} className="group min-w-0 flex-1">
                    <p className="truncate font-normal group-hover:underline">{p.title}</p>
                    <p className="truncate text-xs font-light text-muted-foreground">
                      {categories.find((c) => c.id === p.categoryId)?.name}
                      {p.storeName ? ` · ${p.storeName}` : ""}
                    </p>
                  </Link>
                  <div className="hidden w-28 lg:block">
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                  <TrendChip history={p.priceHistory} className="hidden md:inline-flex" />
                  <span className="w-20 text-right font-light tabular-nums">
                    {formatMoney(p.estimatedCost)}
                  </span>
                  <StatusBadge status={p.status} className="hidden sm:inline-flex" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ---- By category ---- */}
        <TabsContent value="category" className="mt-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["outdoor", "Outdoor"],
                ["indoor", "Indoor"],
                ["repairs", "Repairs"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setZone(key)}
                className={cn(
                  "rounded-full px-4.5 py-2 text-sm font-light transition-all",
                  zone === key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "glass-chip text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredCategories.map((cat) => {
            const items = ranked.filter((p) => p.categoryId === cat.id);
            return (
              <section key={cat.id} className="glass rounded-[1.75rem] p-6">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-xl font-light">{cat.name}</h2>
                  <span className="text-xs font-light text-muted-foreground">
                    {items.length === 0
                      ? "Nothing yet"
                      : `${items.length} project${items.length > 1 ? "s" : ""} · ${formatMoney(
                          items.reduce((s, p) => s + p.estimatedCost, 0)
                        )}`}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-white/[0.03] px-5 py-6 text-center text-sm font-light text-muted-foreground">
                    A blank canvas — add the first idea for the {cat.name.toLowerCase()}.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] transition-all hover:-translate-y-0.5 hover:border-brand-cyan/25 hover:shadow-xl"
                      >
                        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-secondary to-muted">
                          {p.inspirationImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.inspirationImage}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6" strokeWidth={1.25} />
                            </div>
                          )}
                          <StatusBadge
                            status={p.status}
                            className="absolute left-3 top-3 backdrop-blur"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 p-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-normal">{p.title}</p>
                            <p className="text-xs font-light text-muted-foreground">
                              Priority #{p.rank}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 font-light whitespace-nowrap">
                            {formatMoney(p.estimatedCost)}
                            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </TabsContent>
      </Tabs>
    </Reveal>
  );
}

function AddProjectDialog({
  onAdd,
  categories,
  nextRank,
}: {
  onAdd: (p: Project) => void;
  categories: { id: string; name: string }[];
  nextRank: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cost, setCost] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    const price = Number(cost) || 0;
    onAdd({
      id: `p-${Date.now().toString(36)}`,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      rank: nextRank,
      status: "idea",
      estimatedCost: price,
      spent: 0,
      progress: 0,
      storeName: storeName.trim() || undefined,
      storeUrl: storeUrl.trim() || undefined,
      inspirationImage: inspiration.trim() || undefined,
      priceHistory: price ? [{ date: new Date().toISOString().slice(0, 10), price }] : [],
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    setTitle("");
    setCategoryId("");
    setCost("");
    setStoreName("");
    setStoreUrl("");
    setInspiration("");
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl px-5 font-light">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="glass max-w-lg rounded-3xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extralight">Add a project idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-light">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pergola over the patio"
              className="glass-chip h-11 rounded-xl font-light"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-light">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="glass-chip h-11 w-full rounded-xl font-light">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-light">Estimated cost ($)</Label>
              <Input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="1200"
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-light">Store</Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Home Depot"
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-light">Store link</Label>
              <Input
                type="url"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://…"
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-light">Inspiration image URL</Label>
            <Input
              type="url"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              placeholder="https://…"
              className="glass-chip h-11 rounded-xl font-light"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-light">Notes</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does done look like?"
              className="glass-chip min-h-20 rounded-xl font-light"
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl font-light">
            Add to the list
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
