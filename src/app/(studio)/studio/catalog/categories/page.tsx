import type { Route } from "next";
import { forbidden, redirect } from "next/navigation";
import { apiServer, HydrateClient } from "@/core/api/api.server";
import { APP_ROLE, normalizeRole } from "@/core/auth/auth.roles";
import { getServerSession } from "@/core/auth/auth.server";
import CategoryTable from "@/module/category/category.table";
import DashboardSection from "@/shared/components/layout/section/section-dashboard";
import Shell from "@/shared/components/layout/shell";
import { PATH } from "@/shared/config/routes";
import { getListQueryFromSearchParams } from "@/shared/utils/lib/list-query.utils";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { session, user } = await getServerSession();
  if (!session) return redirect(PATH.ROOT);
  if (normalizeRole(user?.role) === APP_ROLE.CUSTOMER) forbidden();

  const input = await searchParams;
  const listQuery = getListQueryFromSearchParams(input);

  const result = await apiServer.category.getMany({
    query: {
      catalogOnly: false,
      search: listQuery.search.q,
      visibility: listQuery.filters.visibility,
      displayType: listQuery.filters.displayType,
      isFeatured: listQuery.filters.isFeatured,
      deleted: listQuery.filters.deleted,
      color: listQuery.filters.color,
      page: listQuery.pagination.page,
      limit: listQuery.pagination.limit,
    },
  });
  return (
    <HydrateClient>
      <Shell>
        <Shell.Section variant="dashboard">
          <DashboardSection
            title="Category Management"
            description="Manage your product categories and subcategories"
            action="Add Category"
            actionUrl={PATH.STUDIO.CATEGORIES.NEW as Route}
          >
            <CategoryTable data={result} />
          </DashboardSection>
        </Shell.Section>
      </Shell>
    </HydrateClient>
  );
}
