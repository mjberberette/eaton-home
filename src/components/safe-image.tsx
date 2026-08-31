"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * External image with a graceful fallback. If an ad/privacy blocker or a
 * network failure prevents the image from loading, we render a quiet
 * placeholder instead of a broken-image hole.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-muted text-muted-foreground",
          fallbackClassName
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-5 w-5" strokeWidth={1.25} />
        <span className="px-4 text-center text-[11px] font-light">
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
