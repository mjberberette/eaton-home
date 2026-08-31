"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpRight, GripVertical, ImageIcon, Pencil, Plus } from "lucide-react";
import { Reveal } from "@/components/anim";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { StatusBadge, TrendChip } from "@/components/project-bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHome } from "@/lib/data-context";
import { formatMoney, type Category, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { db, setRank } = useHome();
  const { projects, categories } = db;
  const [zone, setZone] = useState<"all" | "outdoor" | "indoor" | "repairs">("all");

  const ranked = useMemo(() => [...projects].sort((a, b) => a.rank - b.rank), [projects]);
  const filteredCategories = categories.filter((c) => zone === "all" || c.zone === zone);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overIndex = ranked.findIndex((p) => p.id === over.id);
    if (overIndex >= 0) setRank(String(active.id), overIndex + 1);
  }

  return (
    <Reveal className="space-y-5">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">
            Upgrades &amp; wishes
          </p>
          <h1 className="text-display mt-1 text-4xl sm:text-5xl">Projects</h1>
        </div>
        <ProjectFormDialog
          trigger={
            <Button className="h-11 rounded-2xl px-5 font-light">
              <Plus className="h-4 w-4" />
              New project
            </Button>
          }
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
            <p className="mb-3 px-1 text-xs font-light text-muted-foreground">
              Drag the handle to reorder — or edit any project to type an exact
              priority number.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={ranked.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5">
                  {ranked.map((p, i) => (
                    <SortableRow
                      key={p.id}
                      project={p}
                      first={i === 0}
                      categories={categories}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

function SortableRow({
  project: p,
  first,
  categories,
}: {
  project: Project;
  first: boolean;
  categories: Category[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-transparent bg-white/[0.05] px-3 py-3 transition-colors hover:border-brand-cyan/25 hover:bg-white/[0.09] sm:gap-4 sm:px-4",
        p.status === "done" && "opacity-55",
        isDragging &&
          "relative z-10 border-brand-cyan/50 bg-white/[0.12] opacity-100 shadow-2xl backdrop-blur"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${p.title}`}
        className="-m-1 cursor-grab touch-none rounded-lg p-1 text-muted-foreground/50 transition-colors hover:bg-white/10 hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4.5 w-4.5" />
      </button>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm",
          first ? "bg-brand-yellow font-medium text-brand-ink" : "bg-secondary font-light"
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
      <ProjectFormDialog
        project={p}
        trigger={
          <button
            aria-label={`Edit ${p.title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}
