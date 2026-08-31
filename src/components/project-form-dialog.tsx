"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ImageInput } from "@/components/image-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHome } from "@/lib/data-context";
import type { Project } from "@/lib/types";

/**
 * One dialog for both creating a project and editing an existing one —
 * including its priority number, which inserts/moves it in the master list.
 */
export function ProjectFormDialog({
  project,
  trigger,
}: {
  /** Omit for create mode */
  project?: Project;
  trigger: ReactNode;
}) {
  const { db, addProject, updateProject, setRank } = useHome();
  const { categories, projects } = db;
  const editing = Boolean(project);
  const maxRank = editing ? projects.length : projects.length + 1;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rank, setRankInput] = useState("");
  const [cost, setCost] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [beforeImage, setBeforeImage] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [description, setDescription] = useState("");

  // (Re)fill the form whenever the dialog opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setTitle(project?.title ?? "");
      setCategoryId(project?.categoryId ?? "");
      setRankInput(String(project?.rank ?? projects.length + 1));
      setCost(project ? String(project.estimatedCost) : "");
      setStoreName(project?.storeName ?? "");
      setStoreUrl(project?.storeUrl ?? "");
      setInspiration(project?.inspirationImage ?? "");
      setBeforeImage(project?.beforeImage ?? "");
      setAfterImage(project?.afterImage ?? "");
      setDescription(project?.description ?? "");
    }
    setOpen(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    const price = Number(cost) || 0;
    const targetRank = Math.max(1, Math.min(maxRank, Math.round(Number(rank)) || maxRank));

    if (project) {
      updateProject(project.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        estimatedCost: price,
        storeName: storeName.trim() || undefined,
        storeUrl: storeUrl.trim() || undefined,
        inspirationImage: inspiration.trim() || undefined,
        beforeImage: beforeImage.trim() || undefined,
        afterImage: afterImage.trim() || undefined,
      });
      if (targetRank !== project.rank) setRank(project.id, targetRank);
    } else {
      addProject(
        {
          id: `p-${Date.now().toString(36)}`,
          title: title.trim(),
          description: description.trim(),
          categoryId,
          rank: targetRank,
          status: "idea",
          estimatedCost: price,
          spent: 0,
          progress: 0,
          storeName: storeName.trim() || undefined,
          storeUrl: storeUrl.trim() || undefined,
          inspirationImage: inspiration.trim() || undefined,
          priceHistory: price ? [{ date: new Date().toISOString().slice(0, 10), price }] : [],
          createdAt: new Date().toISOString().slice(0, 10),
        },
        targetRank
      );
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extralight">
            {editing ? "Edit project" : "Add a project idea"}
          </DialogTitle>
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
              <Label className="font-light">Priority (1 = highest)</Label>
              <Input
                type="number"
                min={1}
                value={rank}
                onChange={(e) => setRankInput(e.target.value)}
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <Label className="font-light">Store</Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Home Depot"
                className="glass-chip h-11 rounded-xl font-light"
              />
            </div>
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
          <div className="space-y-1.5">
            <Label className="font-light">Inspiration photo</Label>
            <ImageInput value={inspiration} onChange={setInspiration} />
          </div>
          {editing && (
            <>
              <div className="space-y-1.5">
                <Label className="font-light">Before photo</Label>
                <ImageInput value={beforeImage} onChange={setBeforeImage} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-light">After photo</Label>
                <ImageInput value={afterImage} onChange={setAfterImage} />
              </div>
            </>
          )}
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
            {editing ? "Save changes" : "Add to the list"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
