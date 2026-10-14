"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shared/components/ui/navigation-menu";
import { PATH } from "@/shared/config/routes";
import { LUCSUM_STYLE_LABELS } from "@/shared/config/storefront";

export function SimplifiedNavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="h-full p-0">
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.ROOT}>Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[280px] gap-1 p-3 md:w-[400px]">
              <li>
                <NavigationMenuLink asChild>
                  <Link href={PATH.SHOP.ROOT} className="block rounded-md p-3 font-medium hover:bg-muted">
                    All tees (25 colourways)
                  </Link>
                </NavigationMenuLink>
              </li>
              <li className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Styles</li>
              {Object.entries(LUCSUM_STYLE_LABELS).map(([slug, title]) => (
                <li key={slug}>
                  <NavigationMenuLink asChild>
                    <Link href={`/shop?style=${slug}` as Route} className="block rounded-md p-2 text-sm hover:bg-muted">
                      {title}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.HELP}>Help</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.SITE.LEGAL.ROOT}>Policies</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
