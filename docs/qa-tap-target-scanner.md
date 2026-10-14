# Mobile/tablet QA — tap target scanner rules

Used by `scripts/qa-mobile-tablet.mjs` (`small-tap-target`).

## What we measure

**Effective hit area** for interactive controls: the union of the element’s border box and any ancestor up to 3 levels that is a `button`, `[data-slot="button"]`, `[data-slot="select-trigger"]`, or a `nav` / `header` / `footer` link wrapper with `min-height ≥ 44px`.

A control **passes** when effective width and height are both **≥ 44px**.

## Included (must pass)

- `button`, `[role="button"]`, `[data-slot="button"]`
- `[data-slot="select-trigger"]`
- `input`, `select`, `textarea` (checkout/cart forms)
- Links inside `header`, `footer`, `[data-slot="shell-header"]`, `[data-slot="sheet-content"]`, `[data-slot="navigation-menu"]`
- Cart, menu, and icon actions in the storefront chrome

## Excluded (not counted)

- Inline **prose** links: `a` inside `p`, `.prose`, `[data-slot="prose"]`, or help/legal article body without `data-interactive-link`
- Hidden / zero-size nodes (`display: none`, `visibility: hidden`, 0×0 box)
- Decorative `a` without `href`
- Studio (`/studio`) and account-only chrome (not in KEEP mobile pass routes)

## Related checks

- **horizontal-overflow**: `documentElement` user-scrollable width only (not internal `overflow-x-auto` strips such as PDP thumbnails).
- **header-not-sticky**: `[data-slot="shell-header"]` after 600px scroll (`fixed`/`sticky`, `top ≤ 4`).
