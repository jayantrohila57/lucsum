import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/core/api/api.methods";
import { db } from "@/core/db/db";
import { sitePage } from "@/core/db/db.schema";
import { STATUS } from "@/shared/config/api.config";
import { API_RESPONSE } from "@/shared/config/api.utils";
import { debugError } from "@/shared/utils/lib/logger.utils";
import { sitePageContract } from "./site-page.schema";

export const sitePageRouter = createTRPCRouter({
  getPublicBySlug: publicProcedure
    .input(sitePageContract.getPublicBySlug.input)
    .output(sitePageContract.getPublicBySlug.output)
    .query(async ({ input }) => {
      try {
        const row = await db.query.sitePage.findFirst({
          where: eq(sitePage.slug, input.slug),
        });
        return API_RESPONSE(
          row ? STATUS.SUCCESS : STATUS.FAILED,
          row ? "Site page loaded." : "Site page not found.",
          row ?? null,
        );
      } catch (err) {
        debugError("SITE_PAGE:GET:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Unexpected error while loading site page.", null, err as Error);
      }
    }),
});
