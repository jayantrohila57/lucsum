import { apiServer } from "@/core/api/api.server";

export async function fetchSitePageBySlug(slug: string) {
  const res = await apiServer.sitePage.getPublicBySlug({ slug });
  return res.data ?? null;
}
