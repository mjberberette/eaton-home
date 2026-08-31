"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Staggered entrance for direct children marked with [data-reveal].
 * Gives every page the same cinematic float-up on load.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  stagger = 0.08,
  y = 26,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  y?: number;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = scope.current?.querySelectorAll("[data-reveal]");
      if (!targets?.length) return;
      gsap.fromTo(
        targets,
        { opacity: 0, y, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          stagger,
          delay,
          clearProps: "filter",
        }
      );
    },
    { scope }
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}

/** Animated number that counts up when it enters the DOM. */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.4,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: value,
      duration,
      ease: "power2.out",
      onUpdate: () => setDisplay(obj.v),
    });
    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
