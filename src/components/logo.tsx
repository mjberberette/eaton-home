import { cn } from "@/lib/utils";
import { LOGO_TRACED_PATH } from "./logo-path";

/**
 * Brand mark — the official Eaton Home artwork (pixel-exact vector trace),
 * plus centerline paths used only by the animated draw-on mask.
 */
export const LOGO = {
  viewBox: "0 0 678 900",
  traced: LOGO_TRACED_PATH,
  tracedTransform: "translate(0,900) scale(1,-1)",
  // Mask centerlines follow the animation arrows:
  // ring — junction → up the right side → top → left → bottom → tail cut
  maskRing:
    "M636 560 L636 249 A210 210 0 0 0 426 39 L249 39 A210 210 0 0 0 39 249 L39 648 A210 210 0 0 0 249 858 L426 858 A210 210 0 0 0 634 652",
  // roof — left end → peak → down-right through the ring edge
  maskRoof: "M180 455 L336 327 L668 660",
  maskRingWidth: 115,
  maskRoofWidth: 120,
  windows: [
    { x: 232, y: 514, w: 76, h: 74 },
    { x: 370, y: 514, w: 76, h: 74 },
  ],
  teal: "#3edbc8",
  yellow: "#ffdc26",
};

/** Static Eaton Home mark — the exact uploaded artwork. */
export function EatonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-auto", className)}
      aria-hidden
    >
      <g transform={LOGO.tracedTransform} fill={LOGO.teal}>
        <path d={LOGO.traced} />
      </g>
      {LOGO.windows.map((win) => (
        <rect key={win.x} x={win.x} y={win.y} width={win.w} height={win.h} fill={LOGO.yellow} />
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
