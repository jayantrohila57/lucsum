import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/utils/lib/utils";
import { Button } from "../../ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

interface SectionProps {
  title?: string;
  description?: string;
  action?: string;
  children: React.ReactNode;
  separator?: boolean;
  variant?: "default" | "full";
  className?: string;
  actionLink?: Route;
  isMinHeight?: boolean;
  icon?: LucideIcon;
}

export default function Section({
  variant,
  title,
  description,
  action,
  children,
  separator = true,
  isMinHeight = true,
  className,
  icon,
  actionLink,
}: SectionProps) {
  const DynamicIcon = icon;
  return (
    <Card className={cn("bg-background gap-0 p-0 shadow-none", className)}>
      {title && description && (
        <div className="flex w-full flex-col border-t sm:flex-row">
          {DynamicIcon && (
            <div className="flex w-full items-center justify-center border-b bg-muted/15 py-4 sm:w-40 sm:shrink-0 sm:border-b-0 sm:border-r sm:bg-transparent sm:py-0">
              <div className="flex size-20 items-center justify-center sm:aspect-square sm:size-full sm:max-h-40 sm:max-w-40">
                <DynamicIcon className="size-8 text-muted-foreground sm:size-10" aria-hidden />
              </div>
            </div>
          )}
          <CardHeader className="w-full">
            {title && <CardTitle className="text-2xl font-semibold sm:text-3xl md:text-4xl">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-sm text-muted-foreground sm:text-base">{description}</CardDescription>
            )}
            <CardAction className="mt-4 flex flex-row items-stretch justify-start sm:mt-6 sm:items-end sm:justify-end">
              {action && actionLink && (
                <Link href={actionLink} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">{action}</Button>
                </Link>
              )}
            </CardAction>
          </CardHeader>
        </div>
      )}
      <div className="w-full border-t" />
      <CardContent
        className={cn("min-w-0 overflow-x-clip p-0", isMinHeight && "min-h-0 sm:min-h-[360px] lg:min-h-[600px]")}
      >
        {children}
      </CardContent>
    </Card>
  );
}
