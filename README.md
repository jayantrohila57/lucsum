# LUCSUM Store (Next.js)

Storefront for **LUCSUM**, my Indian streetwear brand from Saharanpur, Uttar Pradesh ("Be your own universe"). Built with **Next.js App Router**, **tRPC**, **Drizzle + PostgreSQL (Neon)**, **Better Auth**, and **Razorpay**.

**Live:** [lucsum.vercel.app](https://lucsum.vercel.app)

## What it is

- Customer catalogue, cart, and checkout, with server-authoritative totals (the server recalculates the order before charging).
- Razorpay payments with HMAC-verified webhooks (`/api/webhooks/razorpay`).
- Better Auth sessions for customers and a staff-only Studio.
- Catalogue, menus, and redirects imported from the brand's previous Shopify store (`pnpm shopify:import`).
- Health endpoints for deploys: `/api/health` and `/api/health/ready`.

Shopify catalogue import: see [docs/SHOPIFY_IMPORT.md](docs/SHOPIFY_IMPORT.md).

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (e.g. Neon) `DATABASE_URL`

## Quick start

```bash
pnpm install
cp .env.example .env.local
# Fill required variables (see below)
pnpm db:migrate
pnpm shopify:import   # after migrate; see docs/SHOPIFY_IMPORT.md
pnpm dev
```

## Required environment (production)

Validated at runtime for `NODE_ENV=production` unless `SKIP_ENV_VALIDATION=true` (not recommended in prod).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 16 chars) |
| `BETTER_AUTH_URL` | Public app URL (e.g. `https://shop.example.com`) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `RAZORPAY_API_KEY` / `RAZORPAY_API_SECRET` | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC verification |
| `NEXT_PUBLIC_BASE_URL` | Canonical URL for SEO / links |

Optional: `ARKJET_API_KEY` or `ARCJET_API_KEY` (both accepted), `BLOB_READ_WRITE_TOKEN`, GitHub OAuth, Sentry DSNs.

## Database

```bash
pnpm db:generate   # after schema changes
pnpm db:migrate
pnpm db:studio
```

## Payments (Razorpay)

1. Create keys in Razorpay dashboard (test or live).
2. Set `RAZORPAY_*` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Register webhook URL: `https://<your-domain>/api/webhooks/razorpay` with the same secret as `RAZORPAY_WEBHOOK_SECRET`.

## Health checks

- `GET /api/health` — process liveness
- `GET /api/health/ready` — database connectivity

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production |
| `pnpm check` | Biome + TypeScript |
| `pnpm test` | Vitest |

## Operator notes

- **Studio** (`/studio`) is restricted to `staff` / `admin` (see `proxy.ts`).
- Checkout totals are **server-authoritative** (`order.previewCheckoutTotals`, `order.create`) so UI, DB order, and Razorpay amounts stay aligned.
- See [docs/requirements.md](docs/requirements.md) for the production audit checklist.

## Sponsor

If you find this project useful, consider supporting its development:

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/jayantrohila57)

## License

Released under the [MIT License](LICENSE).
