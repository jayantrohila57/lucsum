import { cn } from "@/shared/utils/lib/utils";
import { boxTokens } from "./box-tokens";

type BorderedGridProps = React.ComponentProps<"div"> & {
  columns?: 1 | 2 | 3 | 4 | 5;
};

/**
 * Grid with collapsed shared borders (no double lines between cells).
 * Outer edge uses a single border; cells use negative margin overlap.
 */
export function BorderedGrid({ className, columns = 2, children, ...props }: BorderedGridProps) {
  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : columns === 4
            ? "grid-cols-2 md:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";

  return (
    <div
      className={cn(
        "grid overflow-hidden",
        boxTokens.border,
        boxTokens.radius,
        boxTokens.gridGapDense,
        colClass,
        "max-w-full [&>*]:min-w-0 [&>*]:border-border [&>*]:border [&>*]:-ml-px [&>*]:-mt-px [&>*]:overflow-hidden [&>*]:bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BorderedGridCell({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0", boxTokens.cardPaddingCompact, className)} {...props} />;
}
