"use client";

import { useMemo, useState } from "react";
import { BlurImage } from "@/shared/components/common/image";
import { cn } from "@/shared/utils/lib/utils";

type PDPImageGalleryProps = {
  images: string[];
  alt: string;
  overlay?: React.ReactNode;
};

/**
 * Main image + thumbnail strip for PDP. First image is selected by default.
 */
export function PDPImageGallery({ images, alt, overlay }: PDPImageGalleryProps) {
  const list = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(0);
  const safeIndex = list.length ? Math.min(active, list.length - 1) : 0;
  const mainSrc = list[safeIndex] ?? list[0] ?? "";

  if (!list.length) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius)] border border-border bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius)] border border-border bg-muted shadow-sm">
        <BlurImage
          src={mainSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 45vw, 100vw"
          priority
        />
        {overlay ? <div className="absolute right-3 top-3 z-10">{overlay}</div> : null}
      </div>
      {list.length > 1 ? (
        <ul
          className="flex touch-pan-x gap-2 overflow-x-auto pb-2 pt-1 [-webkit-overflow-scrolling:touch] scroll-pl-1 sm:scroll-pl-0"
          role="list"
        >
          {list.map((src, i) => (
            <li key={`${src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative block size-14 overflow-hidden rounded-[var(--radius)] border-2 p-0 transition-colors sm:size-16",
                  "min-h-11 min-w-11",
                  i === safeIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/40",
                )}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === safeIndex}
              >
                <BlurImage src={src} alt="" fill className="object-cover" sizes="(max-width:640px) 56px, 64px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
