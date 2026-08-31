import { cn } from "@/lib/utils";

export const LOGO = {
  viewBox: "0 0 260 320",
  ring: "M233 170 L233 119 A92 92 0 0 0 141 27 L119 27 A92 92 0 0 0 27 119 L27 201 A92 92 0 0 0 119 293 L141 293 A92 92 0 0 0 233 236",
  roof: "M60 152 L128 100 L250 207",
  teal: "#56d3c4",
  yellow: "#f7d842",
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
      <path d={LOGO.ring} stroke={LOGO.teal} strokeWidth="34" />
      <path d={LOGO.roof} stroke={LOGO.teal} strokeWidth="30" />
      <rect x="96" y="190" width="30" height="30" rx="2" fill={LOGO.yellow} />
      <rect x="140" y="190" width="30" height="30" rx="2" fill={LOGO.yellow} />
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
