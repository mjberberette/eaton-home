"use client";

import { useState } from "react";
import { Check, ListTodo, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHome } from "@/lib/data-context";
import { subtaskProgress, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Checklist of steps to finish a project. `compact` is the inline version
 * shown when a list row is expanded; the default is the full project-page card.
 */
export function SubtaskList({ project, compact = false }: { project: Project; compact?: boolean }) {
  const { addSubtask, toggleSubtask, deleteSubtask } = useHome();
  const subs = project.subtasks ?? [];
  const [draft, setDraft] = useState("");
  const doneCount = subs.filter((s) => s.done).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    addSubtask(project.id, draft);
    setDraft("");
  }

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
      {subs.length === 0 && (
        <p
          className={cn(
            "rounded-xl border border-dashed border-border bg-white/[0.03] text-center font-light text-muted-foreground",
            compact ? "px-3 py-2.5 text-xs" : "px-5 py-5 text-sm"
          )}
        >
          No subtasks yet — break this project into steps.
        </p>
      )}
      {subs.map((st) => (
        <div
          key={st.id}
          className={cn(
            "group flex items-center gap-2.5 rounded-xl bg-white/[0.05]",
            compact ? "px-2.5 py-1.5" : "px-3.5 py-2.5",
            st.done && "opacity-60"
          )}
        >
          <button
            onClick={() => toggleSubtask(project.id, st.id)}
            aria-label={st.done ? `Reopen ${st.title}` : `Finish ${st.title}`}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md border transition-colors",
              compact ? "h-5 w-5" : "h-6 w-6",
              st.done
                ? "border-brand-green bg-brand-green text-brand-ink"
                : "border-white/25 hover:border-brand-cyan"
            )}
          >
            {st.done && <Check className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={3} />}
          </button>
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-light",
              compact ? "text-xs" : "text-sm",
              st.done && "line-through"
            )}
          >
            {st.title}
          </span>
          <button
            onClick={() => deleteSubtask(project.id, st.id)}
            aria-label={`Delete subtask ${st.title}`}
            className="shrink-0 rounded-md p-1 text-muted-foreground/35 transition-colors hover:bg-white/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      {subs.length > 0 && !compact && (
        <p className="text-[11px] font-light text-muted-foreground">
          {doneCount} of {subs.length} done · {subtaskProgress(project)}%
        </p>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={compact ? "Add a step…" : "Add a step (e.g. hang canvas prints)"}
          className={cn("glass-chip min-w-0 flex-1 rounded-lg font-light", compact ? "h-9 text-xs" : "h-11 rounded-xl")}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!draft.trim()}
          className={cn("glass-chip shrink-0 font-light", compact ? "h-9 rounded-lg px-3 text-xs" : "h-11 rounded-xl px-4")}
        >
          <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          Add
        </Button>
      </form>
    </div>
  );
}

/** Project-page card wrapper. */
export function ProjectSubtasks({ project }: { project: Project }) {
  const subs = project.subtasks ?? [];
  const doneCount = subs.filter((s) => s.done).length;
  return (
    <section data-reveal className="glass rounded-[1.75rem] p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ListTodo className="h-4.5 w-4.5" />
          <h2 className="text-sm font-normal tracking-wide uppercase">Subtasks</h2>
        </div>
        {subs.length > 0 && (
          <span className="text-xs font-light text-muted-foreground">
            {doneCount} of {subs.length} done
          </span>
        )}
      </div>
      <p className="mb-4 text-xs font-light text-muted-foreground">
        The steps that have to happen before this project counts as finished.
      </p>
      <SubtaskList project={project} />
    </section>
  );
}

/**
 * The "+" toggle used on list rows. Shows a subtask count badge and
 * expands an inline checklist beneath the row.
 */
export function SubtaskToggle({
  project,
  open,
  onToggle,
}: {
  project: Project;
  open: boolean;
  onToggle: () => void;
}) {
  const subs = project.subtasks ?? [];
  const doneCount = subs.filter((s) => s.done).length;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-expanded={open}
      aria-label={open ? "Hide subtasks" : "Show subtasks"}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-light transition-colors",
        open
          ? "bg-brand-cyan/15 text-brand-cyan"
          : "text-muted-foreground/70 hover:bg-white/10 hover:text-foreground"
      )}
    >
      {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {subs.length > 0 && (
        <span className="tabular-nums">
          {doneCount}/{subs.length}
        </span>
      )}
    </button>
  );
}
