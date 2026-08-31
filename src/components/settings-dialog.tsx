"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useHome } from "@/lib/data-context";
import { THEMES, applyTheme, loadTheme, saveTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

/** Applies the signed-in member's saved palette on mount. */
export function ThemeLoader() {
  const { userName } = useHome();
  useEffect(() => {
    applyTheme(loadTheme(userName));
  }, [userName]);
  return null;
}

export function SettingsDialog({ trigger }: { trigger: ReactNode }) {
  const { userName } = useHome();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("dusk");

  function handleOpenChange(next: boolean) {
    if (next) setActive(loadTheme(userName));
    setOpen(next);
  }

  function choose(id: string) {
    setActive(id);
    applyTheme(id);
    saveTheme(userName, id);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass max-h-[90vh] max-w-md overflow-y-auto rounded-3xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-2xl font-extralight">
            <Palette className="h-5 w-5 text-brand-cyan" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-sm font-light text-muted-foreground">
            Signed in as <span className="font-normal text-foreground">{userName}</span> —
            your palette is saved just for you on this device.
          </p>
        </div>

        <div className="mt-2">
          <p className="mb-3 text-xs font-normal tracking-[0.18em] text-muted-foreground uppercase">
            Theme palette
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => choose(theme.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  active === theme.id
                    ? "border-brand-cyan/60 bg-white/[0.08] ring-glow"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                )}
              >
                <span
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 shadow-inner"
                  style={{
                    background: `radial-gradient(120% 120% at 30% 25%, ${theme.accent} 0%, ${theme.deep} 70%, #0a191c 100%)`,
                  }}
                >
                  {active === theme.id && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25">
                      <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-normal">{theme.name}</span>
                  <span className="block truncate text-[11px] font-light text-muted-foreground">
                    {theme.tagline}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
