import { Copyright } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CardSwap, { Card as CardSwapCard } from "@/shared/components/common/card-swap";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LUCSUM_AUTH_GALLERY_IMAGES } from "@/shared/config/lucsum-media";
import { site } from "@/shared/config/site";
import { cn } from "@/shared/utils/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Separator } from "../../ui/separator";
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="motion-all bg-transparent flex h-full w-full grid-cols-1 flex-row gap-0 border-b p-0 md:min-h-[520px] xl:grid-cols-3">
      <CardContent className="motion-all h-full w-full max-w-md border-r p-0 md:col-span-1">
        <CardHeader className="w-full p-4 border-b mb-2">
          <CardTitle className="w-full text-left text-3xl text-balance">{title}</CardTitle>
          <CardDescription className="w-full text-left text-sm text-pretty">{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid h-full w-full gap-4 p-4">
          {children}
          <div className="flex h-full items-center justify-center p-0 pt-4">{footer}</div>
        </CardContent>
        <CardFooter className="mt-auto flex h-auto flex-col items-start justify-start p-4">
          <Alert>
            <AlertTitle>Need help?</AlertTitle>
            <AlertDescription className="flex flex-row flex-wrap gap-1">
              Contact
              <Link target="_blank" href={`mailto:${site.email}` as Route} className="underline">
                {site.email}
              </Link>
              or use live chat.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </CardContent>
      <CardContent className="bg-secondary motion-all relative hidden w-full min-w-0 max-w-full overflow-hidden p-0 xl:col-span-2 xl:block">
        <CardSwap width="100%" height={600} cardDistance={120} verticalDistance={120} delay={200} pauseOnHover={false}>
          {LUCSUM_AUTH_GALLERY_IMAGES.map((item) => (
            <CardSwapCard key={item}>
              <Image
                src={item}
                alt="LUCSUM product"
                className="bg-card h-full w-full rounded-md border object-cover"
                width={1920}
                height={1080}
              />
            </CardSwapCard>
          ))}
        </CardSwap>
      </CardContent>
    </Card>
  );
}

export function AuthFooterNote({ hint, action, href }: { hint: string; action: string; href: Route }) {
  return (
    <p className="text-muted-foreground text-center text-sm">
      {hint}{" "}
      <Link href={href} className="text-primary hover:text-primary/80 underline underline-offset-4">
        {action}
      </Link>
    </p>
  );
}

export function AppBrand({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-center text-xs", className)}>
      <Copyright className="inline-block h-3 w-3 mr-1" /> {`Copyright ${new Date().getFullYear()} - ${site.name}`} All
      rights reserved
    </p>
  );
}
