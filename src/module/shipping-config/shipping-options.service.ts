import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/core/db/db";
import { address, shippingMethod, type shippingProvider, shippingRateRule, shippingZone } from "@/core/db/db.schema";
import type { ShippingOption } from "./shipping-config.schema";

export async function getShippingOptionsForLocation(
  country: string,
  region?: string | null,
): Promise<{ options: ShippingOption[]; zoneId: string | null }> {
  const zone = await resolveShippingZone(country, region);
  if (!zone) {
    return { options: [], zoneId: null };
  }

  const rateRules = await db.query.shippingRateRule.findMany({
    where: and(eq(shippingRateRule.zoneId, zone.id), eq(shippingRateRule.isActive, true)),
  });

  const options: ShippingOption[] = [];

  for (const rule of rateRules) {
    const method = await db.query.shippingMethod.findFirst({
      where: eq(shippingMethod.id, rule.methodId),
      with: {
        provider: true,
      },
    });
    if (!method || !method.isActive || !method.provider || !method.provider.isActive) continue;

    options.push({
      providerId: method.providerId,
      methodId: rule.methodId,
      providerName: method.provider.name,
      methodName: method.name,
      price: rule.price,
      etaDays: inferEtaDays(method, method.provider),
    });
  }

  return { options, zoneId: zone.id };
}

export async function getShippingOptionsForAddressId(
  shippingAddressId: string,
): Promise<{ options: ShippingOption[]; zoneId: string | null }> {
  const addr = await db.query.address.findFirst({
    where: eq(address.id, shippingAddressId),
  });

  if (!addr) {
    return { options: [], zoneId: null };
  }

  return getShippingOptionsForLocation(addr.country, addr.state);
}

async function resolveShippingZone(countryCode: string, regionCode?: string | null) {
  const normalizedCountry = countryCode.toUpperCase();
  const normalizedRegion = regionCode?.toUpperCase() ?? null;

  if (normalizedRegion) {
    const regionZone = await db.query.shippingZone.findFirst({
      where: and(eq(shippingZone.countryCode, normalizedCountry), eq(shippingZone.regionCode, normalizedRegion)),
    });
    if (regionZone) return regionZone;
  }

  const countryZone = await db.query.shippingZone.findFirst({
    where: and(eq(shippingZone.countryCode, normalizedCountry)),
  });

  return countryZone;
}

function inferEtaDays(
  method: typeof shippingMethod.$inferSelect,
  provider: typeof shippingProvider.$inferSelect,
): number | null {
  const methodCode = method.code.toLowerCase();
  if (methodCode.includes("express") || methodCode.includes("fast")) return 2;
  if (methodCode.includes("standard")) return 5;
  if (methodCode.includes("economy")) return 7;
  if (methodCode.includes("cod")) return 6;

  const providerName = provider.name.toLowerCase();
  if (providerName.includes("prime")) return 2;

  return null;
}
