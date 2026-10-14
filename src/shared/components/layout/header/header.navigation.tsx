"use client";

import type { Route } from "next";
import Link from "next/link";
import type * as React from "react";
import { apiClient } from "@/core/api/api.client";
import { SimplifiedNavigationMenu } from "@/shared/components/layout/header/header.simplified-navigation";
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
import { storefrontFeatures } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";
import { BlurImage } from "../../common/image";
import { Separator } from "../../ui/separator";

export function NavigationMenuComponent() {
  if (storefrontFeatures.simplifiedShop) {
    return <SimplifiedNavigationMenu />;
  }
  return <LegacyCategoryNavigationMenu />;
}

function LegacyCategoryNavigationMenu() {
  const { data, isLoading } = apiClient.category.getManyWithSubcategories.useQuery({
    query: {},
  });

  const categories = data?.data ?? [];

  return (
    <NavigationMenu>
      <NavigationMenuList className="h-full p-0">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-2 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 sm:w-[400px] md:w-[700px] lg:w-[1200px]">
              {isLoading && <li className="px-3 py-2 text-sm text-muted-foreground">Loading categories...</li>}
              {!isLoading && categories.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No categories available.</li>
              )}
              {categories.map((category) => (
                <ListItem
                  key={category.id}
                  title={category.title}
                  href={PATH.STORE.CATEGORIES.CATEGORY(category.slug ?? "") as Route}
                  image={category.image}
                >
                  {category.description ?? ""}
                </ListItem>
              ))}
              <ListItem
                key="all-categories"
                title="All Categories"
                href={PATH.STORE.CATEGORIES.ROOT as Route}
                image={null}
              >
                View all categories
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.STORE.ROOT}>Store</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.SITE.ABOUT}>About</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.SITE.CONTACT}>Contact</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={PATH.SITE.SUPPORT.ROOT}>Support</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  title,
  children,
  href,
  image,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string; image: string | null | undefined }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild className="p-0">
        <Link href={href as Route}>
          <div className="flex flex-row items-center border-r border-b h-full w-full p-4  gap-4">
            <BlurImage
              src={getImageSrc(image)}
              alt={title ?? "Category"}
              width={100}
              height={100}
              className="w-20 h-20 object-cover"
            />
            <div className="flex flex-col gap-2 text-sm">
              <div className="leading-none text-xl font-medium">{title}</div>
              <div className="line-clamp-2 text-muted-foreground max-w-60">{children}</div>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
