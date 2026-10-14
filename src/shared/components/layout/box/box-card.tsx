import { cn } from "@/shared/utils/lib/utils";
import { boxTokens } from "./box-tokens";

type BoxCardProps = React.ComponentProps<"div"> & {
  padding?: "default" | "none" | "compact";
};

/** Bordered surface — sharp corners, no shadow ring (storefront box language). */
export function BoxCard({ className, padding = "default", ...props }: BoxCardProps) {
  return (
    <div
      data-slot="box-card"
      className={cn(
        "box-card bg-card text-card-foreground",
        boxTokens.border,
        boxTokens.radius,
        padding === "default" && boxTokens.cardPadding,
        padding === "compact" && boxTokens.cardPaddingCompact,
        padding === "none" && "p-0",
        className,
      )}
      {...props}
    />
  );
}
