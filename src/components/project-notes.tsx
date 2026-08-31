"use client";

import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useHome } from "@/lib/data-context";
import { timeAgo, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

function authorColor(author: string) {
  if (author === "Melanie") return "bg-brand-green text-brand-ink";
  if (author === "Nate") return "bg-brand-orange text-brand-ink";
  return "bg-secondary text-secondary-foreground";
}

export function ProjectNotes({ project }: { project: Project }) {
  const { addNote, deleteNote, userName } = useHome();
  const [draft, setDraft] = useState("");
  const notes = project.notes ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    addNote(project.id, draft);
    setDraft("");
  }

  return (
    <section data-reveal className="glass rounded-[1.75rem] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-4.5 w-4.5" />
          <h2 className="text-sm font-normal tracking-wide uppercase">Notes</h2>
        </div>
        <span className="text-xs font-light text-muted-foreground">
          {notes.length === 0 ? "Start the thread" : `${notes.length} note${notes.length > 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-white/[0.03] px-5 py-5 text-center text-sm font-light text-muted-foreground">
            Measurements, links, second thoughts, victory laps — leave them here
            for each other.
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="group flex items-start gap-3 rounded-2xl bg-white/[0.05] px-4 py-3"
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                authorColor(note.author)
              )}
            >
              {note.author[0] ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-light text-muted-foreground">
                <span className="font-normal text-foreground">{note.author}</span>
                {" · "}
                {timeAgo(note.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-light leading-relaxed text-foreground/90">
                {note.text}
              </p>
            </div>
            <button
              onClick={() => deleteNote(project.id, note.id)}
              aria-label="Delete note"
              className="mt-0.5 rounded-lg p-1 text-muted-foreground/0 transition-colors hover:bg-white/10 hover:text-foreground group-hover:text-muted-foreground/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          placeholder={`Leave a note as ${userName}…`}
          className="glass-chip min-h-20 rounded-xl font-light"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!draft.trim()}
            className="h-10 rounded-xl px-4 font-light"
          >
            <Send className="h-3.5 w-3.5" />
            Add note
          </Button>
        </div>
      </form>
    </section>
  );
}
