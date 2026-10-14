"use client";

import { Boxes, CreditCard, Heart, Lock, MapPin, MessageSquareQuote, ShoppingCart, Truck, UserCog } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PATH } from "@/shared/config/routes";
import { storefrontFeatures } from "@/shared/config/storefront";
import { cn } from "@/shared/utils/lib/utils";

type NavItem = {
  href: Route;
  label: string;
  icon: typeof UserCog;
  id: string;
  /** Match nested routes (e.g. /account/order/:id) */
  matchPrefix?: boolean;
};

const sections: NavItem[] = [
  { id: "account", label: "Account", icon: UserCog, href: PATH.ACCOUNT.ROOT },
  { id: "privacy", label: "Privacy", icon: Lock, href: PATH.ACCOUNT.PRIVACY },
  { id: "cart", label: "Cart", icon: ShoppingCart, href: PATH.ACCOUNT.CART },
  { id: "wishlist", label: "Wishlist", icon: Heart, href: PATH.ACCOUNT.WISHLIST },
  { id: "order", label: "Orders", icon: Boxes, href: PATH.ACCOUNT.ORDER, matchPrefix: true },
  { id: "payment", label: "Payments", icon: CreditCard, href: PATH.ACCOUNT.PAYMENT },
  { id: "address", label: "Addresses", icon: MapPin, href: PATH.ACCOUNT.ADDRESS, matchPrefix: true },
  { id: "shipment", label: "Shipments", icon: Truck, href: PATH.ACCOUNT.SHIPMENT, matchPrefix: true },
  { id: "review", label: "Reviews", icon: MessageSquareQuote, href: PATH.ACCOUNT.REVIEW },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  const href = item.href as string;
  if (pathname === href) return true;
  if (href === (PATH.ACCOUNT.ROOT as string)) {
    return pathname === href || pathname === `${href}/`;
  }
  if (item.matchPrefix) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return false;
}

const simplifiedHidden = new Set(["wishlist", "payment", "shipment", "review", "cart"]);

export function AccountSidebar() {
  const pathname = usePathname();
  const visibleSections = storefrontFeatures.simplifiedShop
    ? sections.filter((s) => !simplifiedHidden.has(s.id))
    : sections;

  return (
    <nav aria-label="Account" className="w-full md:sticky md:top-20 md:self-start">
      <ul className={cn("flex gap-1 overflow-x-auto md:flex-col md:gap-0.5")}>
        {visibleSections.map((section) => {
          const active = isNavActive(pathname, section);
          const Icon = section.icon;
          return (
            <li key={section.id} className="shrink-0 md:w-full">
              <Link
                href={section.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="whitespace-nowrap">{section.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
