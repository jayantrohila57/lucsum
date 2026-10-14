import type { Route } from "next";
import Link from "next/link";
import Header from "@/shared/components/layout/header/header";
import Section from "@/shared/components/layout/section/section";
import { Shell } from "@/shared/components/layout/shell";
import { Button } from "@/shared/components/ui/button";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";

export const metadata = {
  title: `${site.name} | Not found`,
  description: "The page you are looking for does not exist or has been moved.",
};

export default async function NotFound() {
  return (
    <Shell>
      <Shell.Header>
        <Header />
      </Shell.Header>
      <Shell.Main>
        <Shell.Section>
          <Section {...metadata}>
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="space-y-2">
                <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">Page not found</h1>
                <p className="text-muted-foreground mx-auto max-w-md text-sm">
                  The link may be broken or the page may have been removed. Try the store, your account, or support
                  below.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href={PATH.ROOT as Route}>Home</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={PATH.SHOP.ROOT}>Shop</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={PATH.SITE.CONTACT as Route}>Contact support</Link>
                </Button>
              </div>
            </div>
          </Section>
        </Shell.Section>
      </Shell.Main>
    </Shell>
  );
}
