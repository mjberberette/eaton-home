import { cn } from "@/lib/utils";

/** Eaton Home mark — a gabled roofline over an "E" of three hearth lines. */
export function EatonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      aria-hidden
    >
      <rect width="48" height="48" rx="14" fill="url(#eaton-bg)" />
      <path
        d="M12 22.5 24 12l12 10.5"
        stroke="#3CDBC8"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 24.5h14" stroke="#FFDC26" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17 30h11" stroke="#EAF4F1" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17 35.5h14" stroke="#EAF4F1" strokeWidth="2.6" strokeLinecap="round" />
      <defs>
        <linearGradient id="eaton-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14453F" />
          <stop offset="1" stopColor="#071E1C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EatonLogo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <EatonMark className="h-9 w-9" />
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
