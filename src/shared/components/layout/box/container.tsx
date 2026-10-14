import { cn } from "@/shared/utils/lib/utils";
import { boxTokens } from "./box-tokens";

type ContainerProps = React.ComponentProps<"div"> & {
  /** max-w-7xl (default), narrow (3xl), or full */
  width?: "default" | "narrow" | "full";
};

export function Container({ className, width = "default", ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0",
        boxTokens.containerX,
        width === "default" && "max-w-7xl",
        width === "narrow" && "max-w-3xl",
        width === "full" && "max-w-none",
        className,
      )}
      {...props}
    />
  );
}
