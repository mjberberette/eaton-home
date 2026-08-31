"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LOGO } from "@/components/logo";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/**
 * The Eaton mark drawing itself on load: roof sweeps left → peak → down into
 * the tail, the ring circles counterclockwise from the roof junction, then
 * the two windows light up.
 *
 * The SVG is injected imperatively into a host <div> so React reconciliation
 * (data loads, counters re-rendering the page) can never reset the
 * attributes GSAP is animating mid-flight.
 */
export function AnimatedLogo({
  className,
  delay = 0.2,
}: {
  className?: string;
  delay?: number;
}) {
  const host = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = host.current;
      if (!el) return;
      const windowRects = LOGO.windows
        .map(
          (win) => `
          <rect data-window x="${win.x}" y="${win.y}" width="${win.size}" height="${win.size}"
                rx="2" opacity="0" fill="${LOGO.yellow}"
                style="transform-box:fill-box;transform-origin:50% 50%;scale:0.4"/>`
        )
        .join("");
      el.innerHTML = `
        <svg viewBox="${LOGO.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg"
             style="display:block;height:100%;width:auto">
          <path data-ring d="${LOGO.ring}" pathLength="1" stroke-dasharray="1"
                stroke-dashoffset="1" stroke="${LOGO.teal}" stroke-width="${LOGO.ringWidth}"/>
          <path data-roof d="${LOGO.roof}" pathLength="1" stroke-dasharray="1"
                stroke-dashoffset="1" stroke="${LOGO.teal}" stroke-width="${LOGO.roofWidth}"/>
          ${windowRects}
        </svg>`;

      const roof = el.querySelector("[data-roof]");
      const ring = el.querySelector("[data-ring]");
      const windows = el.querySelectorAll("[data-window]");
      if (!roof || !ring || !windows.length) return;

      gsap
        .timeline({ delay, defaults: { ease: "power2.inOut" } })
        // Roof: left end → peak → down-right into the tail
        .to(roof, { attr: { "stroke-dashoffset": 0 }, duration: 0.85 })
        // Ring: up the right side, across the top, down the left, around the bottom
        .to(ring, { attr: { "stroke-dashoffset": 0 }, duration: 1.45 }, "-=0.15")
        // Windows 2 and 3 glow in
        .to(
          windows,
          {
            attr: { opacity: 1 },
            scale: 1,
            duration: 0.4,
            ease: "back.out(2.2)",
            stagger: 0.16,
          },
          "-=0.25"
        );
    },
    { scope: host, dependencies: [delay] }
  );

  return (
    <div
      ref={host}
      className={cn("h-16", className)}
      role="img"
      aria-label="Eaton Home"
    />
  );
}
