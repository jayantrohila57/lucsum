import type { Route } from "next";
import Link from "next/link";
import { NewsletterSignupForm } from "@/module/newsletter/newsletter-signup-form";
import { Icons } from "@/shared/components/common/icons";
import RSS from "@/shared/components/common/rss";
import Social from "@/shared/components/common/social";
import { ThemeToggle } from "@/shared/components/theme/theme-toggle";
import { PATH } from "@/shared/config/routes";
import { site, siteConfig } from "@/shared/config/site";
import { LUCSUM_STYLE_LABELS, storefrontFeatures } from "@/shared/config/storefront";
import { AppBrand } from "../section/auth.card-layout";

type NavItem<T extends string = string> = {
  href: T;
  title: string;
  newTab: boolean;
};

interface NavType {
  title: string;
  submenu: NavItem<Route>[];
}

const shopFooterLinks: NavItem<Route>[] = storefrontFeatures.minimalPublicSite
  ? [
      { title: "All tees", href: PATH.SHOP.ROOT, newTab: false },
      ...Object.entries(LUCSUM_STYLE_LABELS).map(([slug, title]) => ({
        title,
        href: `/shop?style=${slug}` as Route,
        newTab: false,
      })),
    ]
  : storefrontFeatures.simplifiedShop
    ? [{ title: "All tees", href: PATH.STORE.ROOT as Route, newTab: false }]
    : [
        { title: "All products", href: PATH.STORE.ROOT as Route, newTab: false },
        { title: "Categories", href: PATH.STORE.CATEGORIES.ROOT as Route, newTab: false },
      ];

const customerCareLinks: NavItem<Route>[] = storefrontFeatures.minimalPublicSite
  ? [
      { title: "Help & FAQ", href: PATH.HELP, newTab: false },
      { title: "Track order", href: PATH.ACCOUNT.ORDER as Route, newTab: false },
    ]
  : [
      { title: "Track order", href: PATH.ACCOUNT.ORDER as Route, newTab: false },
      { title: "Shipping info", href: "/support/shipping" as Route, newTab: false },
      { title: "Returns & exchanges", href: "/support/returns" as Route, newTab: false },
      { title: "Size guide", href: PATH.SITE.SUPPORT.SIZE_GUIDE, newTab: false },
      { title: "Contact support", href: PATH.SITE.CONTACT as Route, newTab: false },
    ];

const legalFooterLinks: NavItem<Route>[] = storefrontFeatures.minimalPublicSite
  ? [
      { title: "Privacy", href: PATH.SITE.LEGAL.PRIVACY, newTab: false },
      { title: "Terms", href: PATH.SITE.LEGAL.TERMS, newTab: false },
      { title: "Shipping", href: PATH.SITE.LEGAL.SHIPPING, newTab: false },
      { title: "Returns", href: PATH.SITE.LEGAL.RETURN, newTab: false },
    ]
  : [
      { title: "Privacy Policy", href: PATH.SITE.LEGAL.PRIVACY, newTab: false },
      { title: "Terms of Service", href: PATH.SITE.LEGAL.TERMS, newTab: false },
      { title: "Refund Policy", href: PATH.SITE.LEGAL.REFUND, newTab: false },
      { title: "Cookies", href: PATH.SITE.LEGAL.COOKIES, newTab: false },
    ];

export const footer: NavType[] = [
  {
    title: "Shop",
    submenu: shopFooterLinks,
  },
  {
    title: "Customer Care",
    submenu: customerCareLinks,
  },
  {
    title: "Legal",
    submenu: legalFooterLinks,
  },
  {
    title: "Connect",
    submenu: [
      { title: "Instagram", href: siteConfig.socialLinks[1]!.url as Route, newTab: true },
      { title: "Twitter", href: siteConfig.socialLinks[2]!.url as Route, newTab: true },
      { title: "Facebook", href: siteConfig.socialLinks[0]!.url as Route, newTab: true },
      ...(storefrontFeatures.showNewsletterPromo
        ? [{ title: "Newsletter", href: PATH.SITE.NEWSLETTER, newTab: false }]
        : []),
    ],
  },
];

export default function Footer() {
  return (
    <div className="mt-16 h-full w-full min-w-0 items-center justify-between border-r border-t">
      <div className="h-full w-full flex-row">
        <div className="relative flex h-full w-full flex-col-reverse justify-between border-b md:flex-row">
          <div className="z-10 flex min-w-0 max-w-2xl flex-col justify-between border-r p-4 sm:flex-row md:max-w-xl md:flex-col">
            <div className="min-w-0 w-full">
              <Link href={PATH.ROOT}>
                <div className="flex flex-row items-start justify-start gap-1">
                  <div className="mt-1 text-2xl font-medium">{site.name}</div>
                </div>
              </Link>
              <p className="text-muted-foreground pb-5 text-sm leading-tight">{site.description}</p>
              <p className="pb-1 text-sm">
                <span className="text-muted-foreground pr-2">{"Email:"}</span>
                {site.email}
              </p>
              <p className="pb-1 text-sm">
                <span className="text-muted-foreground pr-2">{"Phone:"}</span> {site.phone}
              </p>
              <p className="w-full pb-1 text-sm">
                <span className="text-muted-foreground pr-2">{"Address:"}</span> {site.address}
              </p>
            </div>
            <div className="pb-8 md:pb-16">
              <h4 className="mb-2 text-lg font-semibold">{"Supported Payment"}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border border-border px-2 py-1 font-medium text-foreground">Razorpay</span>
                <span className="rounded-md border border-border px-2 py-1">UPI</span>
                <Icons.visa className="h-8 w-auto" aria-label="Cards" />
                <span className="rounded-md border border-border px-2 py-1">COD</span>
              </div>
            </div>
          </div>
          <div className="z-10 col-span-1 grid w-full min-w-0 grid-cols-1 md:col-span-2">
            <div className="grid w-full grid-cols-1 gap-4 border-b p-4 pb-8 md:grid-cols-4 md:pb-12">
              <div className="col-span-2">
                <h4 className="mb-2 text-lg font-semibold">{"Connect On Social"}</h4>
                <div className="flex gap-5">
                  <Social />
                </div>
              </div>
              {storefrontFeatures.showNewsletterPromo ? (
                <div className="col-span-1 md:col-span-2">
                  <h4 className="mb-2 text-lg font-semibold">Sign up to our newsletter</h4>
                  <NewsletterSignupForm
                    source="footer"
                    className="max-w-md space-y-2"
                    inputClassName="flex-1"
                    submitLabel="Subscribe"
                  />
                </div>
              ) : null}
            </div>
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 p-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {footer?.map(({ title, submenu }) => {
                return (
                  <div key={title} className="min-w-0">
                    <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">{(title && title) || "No Title"}</h3>
                    <ul className="space-y-0 text-sm md:space-y-1">
                      {submenu?.map(({ newTab, href, title }) => {
                        return (
                          <li key={href + title}>
                            <Link
                              className="block py-2 underline-offset-4 hover:underline md:py-1.5"
                              target={newTab ? "_blank" : "_self"}
                              href={href || PATH.ROOT}
                            >
                              {title || "No Title"}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex h-16 w-full min-w-0 items-center justify-between pb-[env(safe-area-inset-bottom)]">
          <div className="flex h-full w-auto min-w-0 items-center justify-center">
            <AppBrand className="flex h-full items-center justify-center border-r p-3 px-4 sm:p-4" />
          </div>
          <div className="flex h-full w-auto shrink-0 items-center justify-center">
            <div className="flex h-full w-14 items-center justify-center border-l p-3 sm:w-16 sm:p-4">
              <ThemeToggle />
            </div>
            <div className="flex h-full w-14 items-center justify-center border-l p-3 sm:w-16 sm:p-4">
              <RSS />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
