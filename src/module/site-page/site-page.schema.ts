import z from "zod/v3";
import { detailedResponse } from "@/shared/schema";

const sitePageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  kind: z.enum(["page", "article", "policy"]),
  title: z.string(),
  bodyHtml: z.string(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
});

export const sitePageContract = {
  getPublicBySlug: {
    input: z.object({ slug: z.string().min(1) }),
    output: detailedResponse(sitePageSchema.nullable()),
  },
};
