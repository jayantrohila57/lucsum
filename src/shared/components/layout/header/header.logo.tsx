import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";

export default function HeaderLogo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <h2 className="motion-all m-0 cursor-pointer text-2xl hover:scale-[.99] active:scale-[.97]">
            <Link
              href={PATH.ROOT}
              aria-label={site.name}
              title={site.name}
              className="inline-flex min-h-11 items-center py-1"
            >
              {site.name}
            </Link>
          </h2>
        </TooltipTrigger>
        <TooltipContent>
          <p> {site.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
