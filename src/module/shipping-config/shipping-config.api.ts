import { and, eq } from "drizzle-orm";
import type z from "zod/v3";
import {
  adminProcedure,
  createTRPCRouter,
  customerProcedure,
  publicProcedure,
  staffProcedure,
} from "@/core/api/api.methods";
import { db } from "@/core/db/db";
import { shippingMethod, shippingProvider, shippingRateRule, shippingZone } from "@/core/db/db.schema";
import {
  shippingConfigContract,
  type shippingMethodListInputSchema,
  type shippingProviderListInputSchema,
  type shippingRateRuleListInputSchema,
  type shippingZoneListInputSchema,
} from "./shipping-config.schema";
import { getShippingOptionsForAddressId, getShippingOptionsForLocation } from "./shipping-options.service";

export const shippingConfigRouter = createTRPCRouter({
  getOptions: publicProcedure
    .input(shippingConfigContract.getOptions.input)
    .output(shippingConfigContract.getOptions.output)
    .query(async ({ input }) => {
      const { shippingAddressId, shippingAddress } = input.body;

      const { options } = shippingAddress
        ? await getShippingOptionsForLocation(shippingAddress.country, shippingAddress.state)
        : await getShippingOptionsForAddressId(shippingAddressId!);

      return {
        status: "success",
        message: options.length ? "Shipping options loaded" : "No shipping options available",
        data: options,
      };
    }),

  // ----------------------
  // Providers
  // ----------------------

  listProviders: staffProcedure
    .input(shippingConfigContract.provider.list.input)
    .output(shippingConfigContract.provider.list.output)
    .query(async ({ input }) => {
      const query = (input?.query ?? {}) as z.infer<typeof shippingProviderListInputSchema>["query"];
      const limit = query?.limit ?? 50;
      const offset = query?.offset ?? 0;

      const rows = await db.query.shippingProvider.findMany({
        orderBy: (sp, { asc }) => [asc(sp.name)],
        limit,
        offset,
      });

      return {
        status: "success",
        message: "Shipping providers fetched",
        data: rows,
      };
    }),

  createProvider: adminProcedure
    .input(shippingConfigContract.provider.create.input)
    .output(shippingConfigContract.provider.create.output)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(shippingProvider)
        .values({
          ...input.body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        status: "success",
        message: "Shipping provider created",
        data: created,
      };
    }),

  updateProvider: adminProcedure
    .input(shippingConfigContract.provider.update.input)
    .output(shippingConfigContract.provider.update.output)
    .mutation(async ({ input }) => {
      const { id } = input.params;
      const [updated] = await db
        .update(shippingProvider)
        .set({
          ...input.body,
          updatedAt: new Date(),
        })
        .where(eq(shippingProvider.id, id))
        .returning();

      return {
        status: "success",
        message: "Shipping provider updated",
        data: updated,
      };
    }),

  // ----------------------
  // Methods
  // ----------------------

  listMethods: staffProcedure
    .input(shippingConfigContract.method.list.input)
    .output(shippingConfigContract.method.list.output)
    .query(async ({ input }) => {
      const query = (input?.query ?? {}) as z.infer<typeof shippingMethodListInputSchema>["query"];
      const limit = query?.limit ?? 50;
      const offset = query?.offset ?? 0;
      const providerId = query?.providerId;

      const rows = await db.query.shippingMethod.findMany({
        where: providerId ? (sm, { eq: eqLocal }) => eqLocal(sm.providerId, providerId) : undefined,
        orderBy: (sm, { asc }) => [asc(sm.name)],
        limit,
        offset,
      });

      return {
        status: "success",
        message: "Shipping methods fetched",
        data: rows,
      };
    }),

  createMethod: adminProcedure
    .input(shippingConfigContract.method.create.input)
    .output(shippingConfigContract.method.create.output)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(shippingMethod)
        .values({
          ...input.body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        status: "success",
        message: "Shipping method created",
        data: created,
      };
    }),

  updateMethod: adminProcedure
    .input(shippingConfigContract.method.update.input)
    .output(shippingConfigContract.method.update.output)
    .mutation(async ({ input }) => {
      const { id } = input.params;
      const [updated] = await db
        .update(shippingMethod)
        .set({
          ...input.body,
          updatedAt: new Date(),
        })
        .where(eq(shippingMethod.id, id))
        .returning();

      return {
        status: "success",
        message: "Shipping method updated",
        data: updated,
      };
    }),

  // ----------------------
  // Zones
  // ----------------------

  listZones: staffProcedure
    .input(shippingConfigContract.zone.list.input)
    .output(shippingConfigContract.zone.list.output)
    .query(async ({ input }) => {
      const query = (input?.query ?? {}) as z.infer<typeof shippingZoneListInputSchema>["query"];
      const limit = query?.limit ?? 50;
      const offset = query?.offset ?? 0;

      const rows = await db.query.shippingZone.findMany({
        orderBy: (sz, { asc }) => [asc(sz.countryCode), asc(sz.regionCode), asc(sz.name)],
        limit,
        offset,
      });

      return {
        status: "success",
        message: "Shipping zones fetched",
        data: rows,
      };
    }),

  createZone: adminProcedure
    .input(shippingConfigContract.zone.create.input)
    .output(shippingConfigContract.zone.create.output)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(shippingZone)
        .values({
          ...input.body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        status: "success",
        message: "Shipping zone created",
        data: created,
      };
    }),

  updateZone: adminProcedure
    .input(shippingConfigContract.zone.update.input)
    .output(shippingConfigContract.zone.update.output)
    .mutation(async ({ input }) => {
      const { id } = input.params;
      const [updated] = await db
        .update(shippingZone)
        .set({
          ...input.body,
          updatedAt: new Date(),
        })
        .where(eq(shippingZone.id, id))
        .returning();

      return {
        status: "success",
        message: "Shipping zone updated",
        data: updated,
      };
    }),

  // ----------------------
  // Rate rules
  // ----------------------

  listRateRules: staffProcedure
    .input(shippingConfigContract.rateRule.list.input)
    .output(shippingConfigContract.rateRule.list.output)
    .query(async ({ input }) => {
      const query = (input?.query ?? {}) as z.infer<typeof shippingRateRuleListInputSchema>["query"];
      const limit = query?.limit ?? 50;
      const offset = query?.offset ?? 0;
      const { methodId, zoneId } = query ?? {};

      const rows = await db.query.shippingRateRule.findMany({
        where: (sr, { and: andLocal, eq: eqLocal }) =>
          andLocal(
            methodId ? eqLocal(sr.methodId, methodId) : undefined,
            zoneId ? eqLocal(sr.zoneId, zoneId) : undefined,
          ),
        orderBy: (sr, { asc }) => [asc(sr.createdAt)],
        limit,
        offset,
      });

      return {
        status: "success",
        message: "Shipping rate rules fetched",
        data: rows,
      };
    }),

  createRateRule: adminProcedure
    .input(shippingConfigContract.rateRule.create.input)
    .output(shippingConfigContract.rateRule.create.output)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(shippingRateRule)
        .values({
          ...input.body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        status: "success",
        message: "Shipping rate rule created",
        data: created,
      };
    }),

  updateRateRule: adminProcedure
    .input(shippingConfigContract.rateRule.update.input)
    .output(shippingConfigContract.rateRule.update.output)
    .mutation(async ({ input }) => {
      const { id } = input.params;
      const [updated] = await db
        .update(shippingRateRule)
        .set({
          ...input.body,
          updatedAt: new Date(),
        })
        .where(eq(shippingRateRule.id, id))
        .returning();

      return {
        status: "success",
        message: "Shipping rate rule updated",
        data: updated,
      };
    }),
});
