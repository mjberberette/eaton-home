import { cn } from "@/lib/utils";

/** Brand mark geometry — traced from the official Eaton Home SVG. */
export const LOGO = {
  viewBox: "0 0 252 320",
  // Starts at the roof junction: draws up the right side, across the top,
  // down the left, around the bottom to the tail cut.
  ring: "M236 166 L236 110 A95 95 0 0 0 141 15 L110 15 A95 95 0 0 0 15 110 L15 210 A95 95 0 0 0 110 305 L141 305 A95 95 0 0 0 235 222",
  // Left end → peak → down-right through the ring edge.
  roof: "M58 152 L120 104 L247 210",
  ringWidth: 30,
  roofWidth: 26,
  windows: [
    { x: 88, y: 186, size: 26 },
    { x: 140, y: 186, size: 26 },
  ],
  teal: "#3edbc8",
  yellow: "#ffdc26",
};

/** Eaton Home mark — a home tucked inside an "e", windows glowing. */
export function EatonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-auto", className)}
      aria-hidden
    >
      <path d={LOGO.ring} stroke={LOGO.teal} strokeWidth={LOGO.ringWidth} />
      <path d={LOGO.roof} stroke={LOGO.teal} strokeWidth={LOGO.roofWidth} />
      {LOGO.windows.map((win) => (
        <rect
          key={win.x}
          x={win.x}
          y={win.y}
          width={win.size}
          height={win.size}
          rx="2"
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
