/**
 * Sole database seed: purge non-Shopify rows, then idempotent import from data/shopify-export.
 *
 * @see docs/SHOPIFY_IMPORT.md
 */
import "dotenv/config";
import { runShopifyImport } from "./shopify-import";

async function main() {
  const summary = await runShopifyImport();
  console.log(JSON.stringify({ seed: "shopify-export", ...summary }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
