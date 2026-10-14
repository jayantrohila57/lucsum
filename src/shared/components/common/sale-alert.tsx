"use client";

import { BadgePercentIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { cn } from "@/shared/utils/lib/utils";

type SaleAlertProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function SaleAlert({
  title = site.name,
  description = site.description,
  className = "",
}: SaleAlertProps) {
  return (
    <Link href={PATH.ROOT}>
      <Alert className={cn("w-auto cursor-pointer", className)}>
        <BadgePercentIcon className="h-5 w-5" />
        <AlertTitle className="text-sm leading-tight font-semibold">{title}</AlertTitle>
        <AlertDescription className="text-muted-foreground mt-1 text-xs">{description}</AlertDescription>
      </Alert>
    </Link>
  );
}
