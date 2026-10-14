"use client";

import { MenuIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";

import { apiClient } from "@/core/api/api.client";
import { BlurImage } from "@/shared/components/common/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { PATH } from "@/shared/config/routes";
import { siteConfig } from "@/shared/config/site";
import { LUCSUM_STYLE_LABELS, storefrontFeatures } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";
import { Separator } from "../../ui/separator";
import { HeaderUtilityActions } from "./header.actions";

type MobileNavContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const MobileNavContext = React.createContext<MobileNavContextType | null>(null);

export function useMobileNav() {
  const ctx = React.useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within MobileNavProvider");
  return ctx;
}

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
      <MobileNavigationSheet />
    </MobileNavContext.Provider>
  );
}

export function MobileNavButton() {
  const { setOpen } = useMobileNav();

  return (
    <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
      <MenuIcon className="h-5 w-5" />
    </Button>
  );
}

function LegacyMobileCategoryAccordion({ onNavigate }: { onNavigate: () => void }) {
  const { data, isLoading } = apiClient.category.getManyWithSubcategories.useQuery({
    query: {},
  });
  const categories = data?.data ?? [];

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="text-sm font-semibold text-muted-foreground px-2">Categories</div>
      {isLoading && <div className="text-sm text-muted-foreground px-2">Loading categories...</div>}
      {!isLoading && categories.length === 0 && (
        <div className="text-sm text-muted-foreground px-2">No categories available</div>
      )}
      <Accordion type="single" collapsible className="w-full">
        {categories.map((category) => (
          <AccordionItem key={category.id} value={category.id} className="p-0">
            <AccordionTrigger className="flex items-center gap-2 p-1">
              <BlurImage
                src={getImageSrc(category.image)}
                alt={category.title ?? "Category"}
                width={40}
                height={40}
                className="w-10 h-10 rounded object-cover"
              />
              <span>{category.title}</span>
            </AccordionTrigger>

            <AccordionContent>
              <div className="flex flex-col gap-2 p-2">
                <Link
                  href={PATH.STORE.CATEGORIES.CATEGORY(category.slug ?? "") as Route}
                  className="text-sm font-medium"
                  onClick={onNavigate}
                >
                  View All
                </Link>
                {category.subcategories?.map((sub) => (
                  <Link
                    key={sub.id}
                    href={PATH.STORE.SUB_CATEGORIES.SUBCATEGORY(sub.slug ?? "", category.slug ?? "") as Route}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={onNavigate}
                  >
                    {sub.title}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function MobileNavigationSheet() {
  const { open, setOpen } = useMobileNav();
  const simplified = storefrontFeatures.simplifiedShop;
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-96 w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{siteConfig.name}</SheetTitle>
        </SheetHeader>
        <Separator />
        <div className="mt-6 flex flex-col gap-2">
          {/* MAIN LINKS */}
          <nav className="flex flex-col  p-4  gap-2 text-lg font-medium">
            <Link href={PATH.ROOT} onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href={simplified ? PATH.SHOP.ROOT : PATH.STORE.ROOT} onClick={() => setOpen(false)}>
              {simplified ? "Shop" : "Store"}
            </Link>
            {simplified ? (
              <>
                <Link href={PATH.HELP} onClick={() => setOpen(false)}>
                  Help
                </Link>
                <Link href={PATH.SITE.LEGAL.ROOT} onClick={() => setOpen(false)}>
                  Policies
                </Link>
              </>
            ) : (
              <>
                <Link href={PATH.SITE.ABOUT} onClick={() => setOpen(false)}>
                  About
                </Link>
                <Link href={PATH.SITE.CONTACT} onClick={() => setOpen(false)}>
                  Contact
                </Link>
                <Link href={PATH.SITE.SUPPORT.ROOT} onClick={() => setOpen(false)}>
                  Support
                </Link>
              </>
            )}
          </nav>
          <Separator />
          <HeaderUtilityActions variant="sheet" />
          <Separator />
          {simplified ? (
            <div className="flex flex-col gap-3 px-4 pb-20">
              <div className="text-sm font-semibold text-muted-foreground">Styles</div>
              <div className="flex flex-col gap-2">
                {Object.entries(LUCSUM_STYLE_LABELS).map(([slug, title]) => (
                  <Link
                    key={slug}
                    href={`/shop?style=${slug}` as Route}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {title}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <LegacyMobileCategoryAccordion onNavigate={close} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
