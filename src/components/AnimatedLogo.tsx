// AnimatedLogo.tsx
// Self-contained animated Eaton Home logo (official brand component).
// The "E" is traced in teal, fills in, then the two yellow windows fade in one after the other.
//
// Usage:
//   import { AnimatedLogo } from "./AnimatedLogo";
//   <AnimatedLogo />                       // default size
//   <AnimatedLogo width={240} />           // custom width
//   <AnimatedLogo replayKey={count} />     // bump to replay the animation
//
// The matching styles live in globals.css (search for "AnimatedLogo").

import type { CSSProperties } from "react";

export const LOGO_PATH =
  "M568.45,284.31C568.45,127.3,441.15,0,284.14,0S4.65,122.55,0,275.48v202.79c4.85,153.3,130.7,275.17,284.14,275.17,126.77,0,238.17-84,273.19-205.32l-59.57-34.39c-20.96,100.91-110.25,173.58-213.62,173.58-120.5,0-218.15-97.68-218.15-218.18v-184.82c0-120.5,97.66-218.18,218.15-218.18s218.18,97.68,218.18,218.18v79.81l-218.08-126.02-152.28,87.82v76.17l152.19-87.86,284.31,164.27v-194.18h0Z";

export const LOGO_VIEWBOX = "0 0 568.45 753.44";

export const LOGO_WINDOWS = [
  { x: 193.33, y: 429.55, size: 66.13 },
  { x: 308.97, y: 429.55, size: 66.13 },
];

export function AnimatedLogo({
  width = 240,
  replayKey = 0,
  className = "",
  style,
}: {
  width?: number;
  replayKey?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      key={replayKey}
      viewBox={LOGO_VIEWBOX}
      width={width}
      style={{ display: "block", height: "auto", ...style }}
      className={className}
      role="img"
      aria-label="Eaton Home logo"
    >
      {/* traced outline */}
      <path
        d={LOGO_PATH}
        pathLength={1}
        className="logo-trace"
        fill="none"
        stroke="var(--brand-teal)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* solid fill (fades in behind the stroke) */}
      <path d={LOGO_PATH} className="logo-fill" fill="var(--brand-teal)" />
      {/* yellow windows */}
      {LOGO_WINDOWS.map((win, i) => (
        <rect
          key={win.x}
          x={win.x}
          y={win.y}
          width={win.size}
          height={win.size}
          fill="var(--brand-yellow)"
          className={`logo-window logo-window-${i + 1}`}
        />
      ))}
    </svg>
  );
}

export default AnimatedLogo;
