import Section from "@/shared/components/layout/section/section";
import { LUCSUM_SHOPIFY_CDN } from "@/shared/config/lucsum-media";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { storefrontFeatures } from "@/shared/config/storefront";
import { getMarketingContentBlock } from "../marketing-content/marketing-content.fetch";
import { MarketingCarousel } from "./site.carousel";

const LUCSUM_HOME_HERO_FALLBACK = [
  {
    title: site.name,
    bodyText: site.description,
    image: LUCSUM_SHOPIFY_CDN.celestialLifestyle,
    ctaLabel: "Shop t-shirts",
    ctaLink: storefrontFeatures.minimalPublicSite
      ? PATH.SHOP.ROOT
      : storefrontFeatures.simplifiedShop
        ? PATH.STORE.ROOT
        : PATH.STORE.CATEGORIES.CATEGORY("t-shirts"),
  },
];

export default async function SiteHero() {
  const content = await getMarketingContentBlock({
    page: "home",
    section: "crousel",
    limit: 1,
  });
  const items = content?.items?.length ? content.items : LUCSUM_HOME_HERO_FALLBACK;
  return (
    <Section>
      <MarketingCarousel items={items} />
    </Section>
  );
}
