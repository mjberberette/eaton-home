"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LOGO } from "@/components/logo";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/**
 * The exact Eaton mark drawing itself on load. The artwork is the official
 * traced logo; a luminance mask with two animated centerline strokes reveals
 * it along the brand's motion arrows: roof left → peak → down into the tail,
 * ring counterclockwise from the junction, then the windows pop in.
 *
 * Injected imperatively so React reconciliation can never reset the
 * attributes GSAP is animating.
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
      const maskId = `eaton-draw-${Math.random().toString(36).slice(2, 8)}`;
      const windowRects = LOGO.windows
        .map(
          (win) => `
          <rect data-window x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}"
                opacity="0" fill="${LOGO.yellow}"/>`
        )
        .join("");
      el.innerHTML = `
        <svg viewBox="${LOGO.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg"
             style="display:block;height:100%;width:auto">
          <defs>
            <mask id="${maskId}" maskUnits="userSpaceOnUse">
              <path data-mask-ring d="${LOGO.maskRing}" pathLength="1" stroke-dasharray="1"
                    stroke-dashoffset="1" stroke="#fff" fill="none"
                    stroke-width="${LOGO.maskRingWidth}" stroke-linecap="round"/>
              <path data-mask-roof d="${LOGO.maskRoof}" pathLength="1" stroke-dasharray="1"
                    stroke-dashoffset="1" stroke="#fff" fill="none"
                    stroke-width="${LOGO.maskRoofWidth}" stroke-linecap="round"/>
            </mask>
          </defs>
          <g data-art mask="url(#${maskId})">
            <g transform="${LOGO.tracedTransform}" fill="${LOGO.teal}">
              <path d="${LOGO.traced}"/>
            </g>
          </g>
          ${windowRects}
        </svg>`;

      const art = el.querySelector("[data-art]");
      const roof = el.querySelector("[data-mask-roof]");
      const ring = el.querySelector("[data-mask-ring]");
      const windows = el.querySelectorAll("[data-window]");
      if (!art || !roof || !ring || !windows.length) return;

      // GSAP owns the window transforms — it resolves SVG bbox centers correctly.
      gsap.set(windows, { scale: 0.4, transformOrigin: "50% 50%" });

      gsap
        .timeline({
          delay,
          defaults: { ease: "power2.inOut" },
          // Once fully drawn, drop the mask so the exact artwork renders
          // unclipped regardless of mask stroke coverage.
          onComplete: () => art.removeAttribute("mask"),
        })
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
      // The animated logo intentionally leaves window rects under GSAP's
      // control only — no competing CSS scale/transform declarations.
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
