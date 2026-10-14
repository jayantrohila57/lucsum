/**
 * LUCSUM box UI tokens — single source for Tailwind class strings.
 * CSS variables live in globals.css (`--box-*`, `--spacing-*`).
 */
export const boxTokens = {
  /** 1px border using theme colour */
  border: "border border-border",
  radius: "rounded-[var(--radius)]",
  cardPadding: "p-6",
  cardPaddingCompact: "p-4",
  sectionY: "py-8 md:py-10 lg:py-12",
  containerX: "px-4 sm:px-6 lg:px-8",
  gridGap: "gap-4 md:gap-6",
  gridGapDense: "gap-0",
} as const;
