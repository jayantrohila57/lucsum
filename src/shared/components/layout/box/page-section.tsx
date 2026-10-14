import { cn } from "@/shared/utils/lib/utils";
import { boxTokens } from "./box-tokens";
import { Container } from "./container";

type PageSectionProps = React.ComponentProps<"section"> & {
  containerWidth?: "default" | "narrow" | "full";
  bleed?: boolean;
};

/** Vertical section spacing aligned to storefront scale. */
export function PageSection({ className, containerWidth, bleed, children, ...props }: PageSectionProps) {
  if (bleed) {
    return (
      <section className={cn(boxTokens.sectionY, className)} {...props}>
        {children}
      </section>
    );
  }
  return (
    <section className={cn(boxTokens.sectionY, className)} {...props}>
      <Container width={containerWidth}>{children}</Container>
    </section>
  );
}
