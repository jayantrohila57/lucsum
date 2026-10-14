# Dependency upgrade (2026-10)

## Scope

Bumped runtime and tooling to current stable releases via `pnpm update --latest`, then fixed breaking API changes. No production database migrations or env changes.

## Major migrations

| Area | Change |
|------|--------|
| **Next.js** | 16.2.x → 16.4.x; removed deprecated `experimental.viewTransition` (use View Transitions API in app code if needed). |
| **React** | 19.2 → 19.3 |
| **Zod** | v4 default import; app forms that use `@hookform/resolvers` still use `zod/v3` until resolvers fully align with v4. |
| **Sentry** | `@sentry/nextjs` 11.x: `withSentryConfig` from `@sentry/nextjs/config`; removed `sendDefaultPii`, `includeLocalVariables`, `enableLogs` from init (use current Sentry docs for PII/logging). |
| **Arcjet** | Email rule uses `deny` instead of `block` in `protectSignup`. |
| **react-resizable-panels** | v4: `Group` / `Panel` / `Separator` named exports (shadcn `resizable` updated). |
| **react-day-picker** | v10: `month_grid` class name replaces `table` in calendar styles. |
| **Biome** | 2.5.x schema migration (`biome migrate`). |
| **Vitest** | 5.x |
| **TypeScript** | 7.x |

## Intentional pins (latest major deferred)

| Package | Pinned | Reason |
|---------|--------|--------|
| `@tanstack/react-table` | 8.21.3 | v9 generic/column API breaks Studio tables without a dedicated migration pass. |
| `lucide-react` | 0.577.0 | v1 removes several icon names used in auth UI (`Github`, etc.). |
| `recharts` | 2.15.4 | shadcn `chart.tsx` targets Recharts 2; v3 tooltip props differ. |

## Verification

- `pnpm run check`
- `pnpm test`
- `pnpm build` (with CI env vars / `SKIP_ENV_VALIDATION=true`)
- `npx shadcn@latest diff` — no registry drift

## Follow-up

- Migrate remaining Zod schemas from `zod/v3` to Zod 4.
- Upgrade TanStack Table to v9 with typed `ColumnDef<TData, TValue>`.
- Recharts 3 + shadcn chart refresh when Studio analytics need v3 features.
