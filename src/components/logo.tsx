import { cn } from "@/lib/utils";
import { LOGO_PATH, LOGO_VIEWBOX, LOGO_WINDOWS } from "./AnimatedLogo";

export const LOGO = {
  viewBox: LOGO_VIEWBOX,
  path: LOGO_PATH,
  windows: LOGO_WINDOWS,
  teal: "#3edbc8",
  yellow: "#ffdc26",
};

/** Static Eaton Home mark — the official brand artwork. */
export function EatonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-auto", className)}
      aria-hidden
    >
      <path d={LOGO.path} fill={LOGO.teal} />
      {LOGO.windows.map((win) => (
        <rect
          key={win.x}
          x={win.x}
          y={win.y}
          width={win.size}
          height={win.size}
          fill={LOGO.yellow}
        />
      ))}
    </svg>
  );
}

export function EatonLogo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <EatonMark className="h-9" />
      <div className="leading-none">
        <span
          className={cn(
            "block text-[17px] font-extralight tracking-[0.22em] uppercase",
            dark ? "text-white" : "text-foreground"
          )}
        >
          Eaton
        </span>
        <span
          className={cn(
            "block text-[11px] font-light tracking-[0.42em] uppercase",
            dark ? "text-white/60" : "text-muted-foreground"
          )}
        >
          Home
        </span>
      </div>
    </div>
  );
}
