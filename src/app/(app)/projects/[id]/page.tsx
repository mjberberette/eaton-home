"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ExternalLink,
  ImageIcon,
  LineChart,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/anim";
import { PriceCheck } from "@/components/price-check";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { ProjectNotes } from "@/components/project-notes";
import { SafeImage } from "@/components/safe-image";
import { StatusBadge, TrendChip } from "@/components/project-bits";
import { PriceChart } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useHome } from "@/lib/data-context";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  formatMoney,
  timeAgo,
  type ProjectStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { db, updateProject, addPricePoint } = useHome();
  const project = db.projects.find((p) => p.id === params.id);
  const [newPrice, setNewPrice] = useState("");

  if (!project) {
    return (
      <div className="glass mx-auto mt-20 max-w-md rounded-3xl p-10 text-center">
        <p className="text-lg font-light">This project isn&apos;t on the list anymore.</p>
        <Button asChild variant="outline" className="glass-chip mt-6 rounded-xl font-light">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </Button>
      </div>
    );
  }

  const category = db.categories.find((c) => c.id === project.categoryId);
  const history = [...project.priceHistory].sort((a, b) => a.date.localeCompare(b.date));
  const lowest = history.length ? Math.min(...history.map((h) => h.price)) : null;
  const atLowest = lowest !== null && project.estimatedCost <= lowest;

  function submitPrice(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(newPrice);
    if (!price || !project) return;
    addPricePoint(project.id, { date: new Date().toISOString().slice(0, 10), price });
    setNewPrice("");
  }

  return (
    <Reveal className="space-y-5">
      {/* Header */}
      <div data-reveal className="flex flex-wrap items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <Link
            href="/projects"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-light tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {category?.name ?? "Projects"}
          </Link>
          <h1 className="text-display text-3xl sm:text-5xl">{project.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <StatusBadge status={project.status} />
            <span className="glass-chip rounded-full px-3 py-1 text-[11px] font-light">
              Priority #{project.rank}
            </span>
            <TrendChip history={history} />
            {project.updatedBy && project.updatedAt && (
              <span className="glass-chip rounded-full px-3 py-1 text-[11px] font-light text-muted-foreground">
                Updated by {project.updatedBy} · {timeAgo(project.updatedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <ProjectFormDialog
            project={project}
            trigger={
              <Button variant="outline" className="glass-chip h-11 rounded-2xl px-5 font-light">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          {project.storeUrl && (
            <Button asChild className="h-11 rounded-2xl px-5 font-light">
              <a href={project.storeUrl} target="_blank" rel="noopener noreferrer">
                Shop at {project.storeName ?? "store"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div data-reveal className="grid gap-4 md:grid-cols-3">
        <GalleryTile
          label="Inspiration"
          icon={<Sparkles className="h-4 w-4" />}
          src={project.inspirationImage}
          emptyText="Drop an inspiration image URL to dream in color."
          accent="text-brand-yellow"
        />
        <GalleryTile
          label="Before"
          icon={<Camera className="h-4 w-4" />}
          src={project.beforeImage}
          emptyText="Snap the 'before' so future-you can gloat."
          accent="text-brand-orange"
        />
        <GalleryTile
          label="After"
          icon={<ImageIcon className="h-4 w-4" />}
          src={project.afterImage}
          emptyText={
            project.status === "done"
              ? "It's done — add the glory shot!"
              : "The after photo goes here when it's finished."
          }
          accent="text-brand-cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Price tracking + market check */}
        <div className="flex flex-col gap-5">
        <section data-reveal className="glass rounded-[1.75rem] p-6">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <LineChart className="h-4.5 w-4.5" />
            <h2 className="text-sm font-normal tracking-wide uppercase">Price tracking</h2>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-display text-5xl">{formatMoney(project.estimatedCost)}</p>
              <p className="mt-1 text-xs font-light text-muted-foreground">
                {atLowest
                  ? "Lowest price tracked — a great time to buy."
                  : lowest !== null
                    ? `Lowest seen: ${formatMoney(lowest)}`
                    : "Add price checks to spot the best time to buy."}
              </p>
            </div>
            {atLowest && (
              <span className="glow-cyan rounded-full bg-brand-cyan/15 px-4 py-1.5 text-xs font-normal text-teal-200">
                Best time to buy
              </span>
            )}
          </div>

          <PriceChart history={history} className="mt-6" />

          <div className="mt-6 space-y-2">
            {history
              .slice()
              .reverse()
              .map((pt) => (
                <div
                  key={pt.date + pt.price}
                  className="flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm"
                >
                  <span className="font-light text-muted-foreground">
                    {new Date(pt.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {pt.note && <span className="ml-2 text-xs">· {pt.note}</span>}
                  </span>
                  <span className="font-normal tabular-nums">{formatMoney(pt.price)}</span>
                </div>
              ))}
          </div>

          <form onSubmit={submitPrice} className="mt-4 flex gap-2">
            <Input
              type="number"
              min="1"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Log today's price…"
              className="glass-chip h-11 rounded-xl font-light"
            />
            <Button type="submit" variant="outline" className="glass-chip h-11 rounded-xl font-light">
              <Plus className="h-4 w-4" />
              Log price
            </Button>
          </form>
        </section>

        <PriceCheck project={project} />
        </div>

        {/* Progress & details */}
        <div className="flex flex-col gap-5">
          <section data-reveal className="glass rounded-[1.75rem] p-6">
            <h2 className="mb-5 text-sm font-normal tracking-wide text-muted-foreground uppercase">
              Progress
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label className="font-light">Completion</Label>
                  <span className="font-normal">{project.progress}%</span>
                </div>
                <Slider
                  value={[project.progress]}
                  max={100}
                  step={5}
                  onValueChange={([v]) => updateProject(project.id, { progress: v })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-light">Status</Label>
                <Select
                  value={project.status}
                  onValueChange={(v) => updateProject(project.id, { status: v as ProjectStatus })}
                >
                  <SelectTrigger className="glass-chip h-11 w-full rounded-xl font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-light">Spent so far ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={project.spent || ""}
                  placeholder="0"
                  onChange={(e) =>
                    updateProject(project.id, { spent: Number(e.target.value) || 0 })
                  }
                  className="glass-chip h-11 rounded-xl font-light"
                />
              </div>
            </div>
          </section>

          <section data-reveal className="glass rounded-[1.75rem] p-6">
            <h2 className="mb-3 text-sm font-normal tracking-wide text-muted-foreground uppercase">
              The plan
            </h2>
            <p className="text-sm font-light leading-relaxed text-foreground/85">
              {project.description || "No plan written yet — add the vision."}
            </p>
          </section>

          <ProjectNotes project={project} />
        </div>
      </div>
    </Reveal>
  );
}

function GalleryTile({
  label,
  icon,
  src,
  emptyText,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  src?: string;
  emptyText: string;
  accent: string;
}) {
  return (
    <figure className="glass group relative h-56 overflow-hidden rounded-[1.75rem]">
      {src ? (
        <SafeImage
          src={src}
          alt={label}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
          <span className={cn("opacity-70", accent)}>{icon}</span>
          <p className="text-xs font-light text-muted-foreground">{emptyText}</p>
        </div>
      )}
      <figcaption className="glass-chip absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-light tracking-[0.15em] uppercase">
        <span className={accent}>{icon}</span>
        {label}
      </figcaption>
    </figure>
  );
}
