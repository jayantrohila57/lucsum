export function slugToTitle(slug: string | null | undefined): string {
  if (!slug) return "";

  if (slug.toLowerCase() === "t-shirts") return "T-Shirts";

  return slug
    .replace(/[-_]+/g, " ") // replace slug separators with spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
}

export function nameToSlug(name: string | null | undefined): string {
  if (!name) return "";

  return name
    .normalize("NFKD") // remove diacritics (café → cafe)
    .replace(/[^\p{L}\p{N}]+/gu, "-") // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .toLowerCase();
}
