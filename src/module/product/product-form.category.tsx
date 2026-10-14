"use client";

import { apiClient } from "@/core/api/api.client";
import Form from "@/shared/components/form/form";
import type { Option } from "@/shared/components/form/form.types";

// Placeholder value that should never be submitted
const PLACEHOLDER_VALUE = "";

export function CategorySelect() {
  const { data: categories } = apiClient.category.getMany.useQuery({
    query: { catalogOnly: false },
  });

  const buildCategoryOptions = (): Option[] => {
    return [
      {
        label: "Select category...",
        value: PLACEHOLDER_VALUE,
        disabled: true,
      },
      ...(categories?.data?.map((t) => ({
        label: t.title,
        value: t.slug,
        icon: t.icon,
      })) || []),
    ];
  };
  return (
    <Form.Field
      {...{
        name: "body.categorySlug",
        label: "Category",
        type: "select",
        description: "Select the category of the product",
        helperText: "The category is used to organize products",
        required: true,
        placeholder: "Select category",
        options: buildCategoryOptions(),
      }}
    />
  );
}
