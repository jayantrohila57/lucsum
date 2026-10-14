"use client";

import Autoplay from "embla-carousel-autoplay";
import { SquareIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";
import { BlurImage } from "@/shared/components/common/image";
import { Button } from "@/shared/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel";
import { getImageSrc } from "@/shared/utils/lib/image.utils";
import { cn } from "@/shared/utils/lib/utils";
import type { MarketingContentSelect } from "../marketing-content/marketing-content.types";

type CarouselItem = NonNullable<MarketingContentSelect["items"]>[number];

export function MarketingCarousel({ items }: { items: CarouselItem[] | null | undefined }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const autoplay = React.useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
      stopOnLastSnap: true,
    }),
  );

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  const slides = items ?? [];
  if (slides.length === 0) return null;

  return (
    <Carousel
      className="w-full max-w-full overflow-hidden"
      opts={{ loop: true, align: "start", dragFree: false }}
      plugins={[autoplay.current]}
      setApi={setApi}
    >
      <div>
        <CarouselContent className="ml-0">
          {slides.map((item, i) => {
            const title = item.title ?? "Banner";
            const href = item.ctaLink ?? undefined;
            return (
              <CarouselItem key={i} className="min-w-0 basis-full pl-0">
                <div className="group relative w-full max-w-full overflow-hidden rounded-[var(--radius)] border border-border bg-muted text-balance">
                  <div className="relative aspect-[21/9] min-h-[220px] w-full max-w-full sm:min-h-[280px]">
                    <BlurImage src={getImageSrc(item.image)} alt={title} fill sizes="100vw" className="object-cover" />
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent"
                      aria-hidden
                    />
                    <div className="relative z-10 flex h-full max-w-xl flex-col justify-center gap-4 p-6 md:max-w-2xl md:gap-6 md:p-10">
                      <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h2>
                      {item.bodyText ? (
                        <p className="text-sm text-muted-foreground md:text-base">{item.bodyText}</p>
                      ) : null}
                      {href ? (
                        <Button variant="default" size="lg" className="w-fit" asChild>
                          <Link href={href as Route}>{item.ctaLabel ?? "View more"}</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </div>
      <div className="flex w-full border-y h-12 md:h-16 flex-row items-center justify-between">
        <div className="flex h-full w-full items-center justify-start">
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => api?.scrollTo(i)}
              className="size-12 md:size-16 cursor-pointer hover:bg-secondary flex items-center justify-center border-r"
            >
              <SquareIcon
                className={cn(
                  "h-4 w-4 stroke-2",
                  i === current - 1 ? "text-primary fill-primary" : "text-muted-foreground",
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex relative h-full w-full items-center justify-end">
          <div className="size-12 md:size-16 cursor-pointer hover:bg-secondary flex items-center justify-center border-l">
            <CarouselPrevious variant={"ghost"} className="relative cursor-pointer rounded-none" />
          </div>
          <div className="size-12 md:size-16 cursor-pointer hover:bg-secondary flex items-center justify-center border-l">
            <CarouselNext variant={"ghost"} className="relative cursor-pointer rounded-none" />
          </div>
        </div>
      </div>
    </Carousel>
  );
}
