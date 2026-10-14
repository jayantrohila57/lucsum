"use client";

import { ArrowRightIcon, CheckIcon, CopyIcon, HomeIcon, LinkIcon, SlashIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { PATH } from "@/shared/config/routes";
import { formatBreadcrumbLabel } from "@/shared/utils/lib/breadcrumb-label";
import { debugError } from "@/shared/utils/lib/logger.utils";
import { cn } from "@/shared/utils/lib/utils";
import { Button } from "../../ui/button";

type BreadcrumbItem = {
  href: string;
  label: string;
};

type BreadcrumbWithHidden = BreadcrumbItem & {
  hidden: BreadcrumbItem[];
};

type BreadcrumbNode = BreadcrumbItem | BreadcrumbWithHidden;

const hasHidden = (node: BreadcrumbNode): node is BreadcrumbWithHidden => {
  return "hidden" in node;
};

// -------------------------------------------------------
// Break path into breadcrumb objects
// -------------------------------------------------------
const generateBreadcrumbs = (pathname: string) => {
  const arr = pathname?.split("/")?.filter(Boolean);
  return arr.map((segment, index) => {
    const href = `/${arr.slice(0, index + 1).join("/")}`;
    return { href, label: segment };
  });
};

// -------------------------------------------------------
// Compress: first / ... / second-last / last
// Return hidden list too
// -------------------------------------------------------
const compressBreadcrumbs = (items: BreadcrumbItem[]): { visible: BreadcrumbNode[]; hidden: BreadcrumbItem[] } => {
  if (items.length <= 3) return { visible: items, hidden: [] };

  const first = items[0];
  const last = items[items.length - 1];
  const secondLast = items[items.length - 2];

  const hidden = items.slice(1, items.length - 2);

  const visible = [
    first,
    { href: "", label: "...", hidden }, // clickable ellipses with hidden data
    secondLast,
    last,
  ];

  return { visible, hidden };
};

// -------------------------------------------------------
// Component
// -------------------------------------------------------
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const raw = generateBreadcrumbs(pathname);
  const { visible: breadcrumbs } = compressBreadcrumbs(raw);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    const toastId = toast.loading("Copying URL...");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
      toast.success("URL copied to clipboard", { id: toastId });
    } catch (error) {
      debugError("BREADCRUMB_COPY_URL_ERROR", error);
      toast.error("Failed to copy URL", { id: toastId });
    }
  };
  return (
    <Breadcrumb className="flex w-auto group flex-row">
      <BreadcrumbList className={cn(className)}>
        {/* Home */}
        <BreadcrumbItem>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BreadcrumbLink href={PATH.ROOT}>
                  <HomeIcon size={16} aria-hidden="true" />
                  <span className="sr-only">Home</span>
                </BreadcrumbLink>
              </TooltipTrigger>
              <TooltipContent>Go to website homepage</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </BreadcrumbItem>

        {breadcrumbs.map((node, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator className="first:hidden">
              <SlashIcon className="mx-1 -rotate-12" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {/* Ellipses dropdown node */}
              {node.label === "..." && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer rounded">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <BreadcrumbEllipsis />
                        </TooltipTrigger>
                        <TooltipContent>Hidden Links</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[180px]">
                    {hasHidden(node) &&
                      node.hidden.map((h, i) => (
                        <DropdownMenuItem key={i} asChild>
                          <Link href={h.href as Route}>{formatBreadcrumbLabel(h.label)}</Link>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Last node (active page) */}
              {node.label !== "..." && index === breadcrumbs.length - 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BreadcrumbPage>{formatBreadcrumbLabel(node.label)}</BreadcrumbPage>
                    </TooltipTrigger>
                    <TooltipContent>Your current page</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Regular nodes */}
              {node.label !== "..." && index !== breadcrumbs.length - 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BreadcrumbLink asChild className="underline-offset-4 hover:underline">
                        <Link href={node.href as Route}>{formatBreadcrumbLabel(node.label)}</Link>
                      </BreadcrumbLink>
                    </TooltipTrigger>
                    <TooltipContent>Go to {formatBreadcrumbLabel(node.label)}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}

        {/* Copy current URL */}
        <BreadcrumbItem className="ml-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={handleCopyUrl} aria-label="Copy current URL">
                  {copied ? (
                    <CheckIcon
                      aria-hidden="true"
                      focusable="false"
                      role="presentation"
                      className="h-3.5 w-3.5 text-emerald-500"
                    />
                  ) : (
                    <>
                      <CopyIcon
                        aria-hidden="true"
                        focusable="false"
                        role="presentation"
                        className="h-3.5 w-3.5 hidden group-hover:block"
                      />
                      <LinkIcon
                        aria-hidden="true"
                        focusable="false"
                        role="presentation"
                        className="h-3.5 w-3.5 block group-hover:hidden"
                      />
                    </>
                  )}
                  <span className="sr-only">Copy current URL</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy current URL</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
