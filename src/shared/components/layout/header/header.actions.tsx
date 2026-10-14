"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/core/auth/auth.client";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PATH } from "@/shared/config/routes";
import { storefrontFeatures } from "@/shared/config/storefront";
import { Button } from "../../ui/button";
import { UserDropdown } from "../user/nav-user";

const ModeToggle = dynamic(async () => await import("@/core/theme/theme.selector").then((mod) => mod.ModeToggle), {
  ssr: false,
  loading: () => <Skeleton className="h-9 w-9 rounded-md" />,
});

const CartButton = dynamic(
  async () => await import("@/shared/components/common/cart-button").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-9 w-9 rounded-md" />,
  },
);

const WishListButton = dynamic(
  async () => await import("@/shared/components/common/wishlist-button").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-9 w-9 rounded-md" />,
  },
);

/** Placeholder for auth slot so server and client render the same structure and avoid hydration mismatch. */
function AuthSlotSkeleton() {
  return <Skeleton className="h-9 w-9 rounded-md" />;
}

function useAuthToolbarSlot() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <AuthSlotSkeleton />;
  if (session?.user) return <UserDropdown user={session.user} />;
  return (
    <Link href={PATH.AUTH.SIGN_UP}>
      <Button size="sm" variant="ghost" className="px-2 sm:px-3">
        Sign Up
      </Button>
    </Link>
  );
}

/** Cart + wishlist — always visible in the header (including narrow mobile). */
export function HeaderCommerceActions() {
  return (
    <div className="flex h-full flex-row items-stretch">
      <div className="flex items-center border-l px-1.5 py-2 sm:px-4">
        <CartButton />
      </div>
      {storefrontFeatures.showWishlist ? (
        <div className="flex items-center border-l px-1.5 py-2 sm:px-4">
          <WishListButton />
        </div>
      ) : null}
    </div>
  );
}

type HeaderUtilityVariant = "toolbar" | "sheet";

/** Theme + account — toolbar uses borders; sheet is a compact inline row for the mobile menu. */
export function HeaderUtilityActions({ variant = "toolbar" }: { variant?: HeaderUtilityVariant }) {
  const authSlot = useAuthToolbarSlot();
  const isSheet = variant === "sheet";

  if (isSheet) {
    return (
      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Appearance &amp; account</p>
        <div className="flex flex-wrap items-center gap-3">
          <ModeToggle />
          {authSlot}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-row items-stretch">
      <div className="flex items-center border-l px-2 py-2 sm:px-4">
        <ModeToggle />
      </div>
      <div className="flex min-w-0 items-center border-l px-2 py-2 sm:px-4">{authSlot}</div>
    </div>
  );
}

/** Full header action strip (commerce + utilities) — for wide toolbars only. */
export function HeaderActions() {
  return (
    <div className="flex h-full flex-row items-stretch">
      <HeaderCommerceActions />
      <HeaderUtilityActions />
    </div>
  );
}
