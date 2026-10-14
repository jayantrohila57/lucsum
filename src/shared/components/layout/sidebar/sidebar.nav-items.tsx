import {
  CreditCard,
  Layout,
  LayoutDashboard,
  LifeBuoy,
  type LucideIcon,
  MessageSquare,
  Package,
  Percent,
  ShoppingBag,
  Star,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { useSession } from "@/core/auth/auth.client";
import { APP_ROLE, normalizeRole, roleCanAccessStudio } from "@/core/auth/auth.roles";
import { PATH } from "@/shared/config/routes";
import { storefrontFeatures } from "@/shared/config/storefront";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavSection {
  title: string;
  section: NavItem[];
}

export const getDashboardItems = (role?: string): NavItem[] => [
  {
    title: "Overview",
    url: PATH.STUDIO.ROOT,
    icon: LayoutDashboard,
  },
];
export const getCatalogItems = (role?: string): NavItem[] => [
  {
    title: "Catalog",
    url: PATH.STUDIO.PRODUCTS.ROOT,
    icon: Package,
    items: [
      { title: "Products", url: PATH.STUDIO.PRODUCTS.ROOT, icon: Package },
      { title: "Categories", url: PATH.STUDIO.CATEGORIES.ROOT, icon: Package },
      { title: "Attributes", url: PATH.STUDIO.ATTRIBUTES.ROOT, icon: Tags },
    ],
  },
];
export const getOrdersItems = (role?: string): NavItem[] => [
  {
    title: "Orders",
    url: PATH.STUDIO.ORDERS.ROOT,
    icon: ShoppingBag,
    items: [
      { title: "All Orders", url: PATH.STUDIO.ORDERS.ROOT, icon: ShoppingBag },
      { title: "Returns", url: `${PATH.STUDIO.SHIPPING.ROOT}?status=returned`, icon: Truck },
      { title: "Refunds", url: `${PATH.STUDIO.PAYMENT.ROOT}?status=refunded`, icon: CreditCard },
    ],
  },
];
export const getCustomersItems = (role?: string): NavItem[] => [
  {
    title: "Users",
    url: PATH.STUDIO.USERS.ROOT,
    icon: Users,
    items: [
      { title: "All Users", url: PATH.STUDIO.USERS.ROOT, icon: Users },
      { title: "Customers", url: `${PATH.STUDIO.USERS.ROOT}?role=customer`, icon: Users },
      { title: "Staff", url: `${PATH.STUDIO.USERS.ROOT}?role=staff`, icon: Users },
      { title: "Reviews", url: PATH.STUDIO.REVIEWS.ROOT, icon: Star },
    ],
  },
];
export const getInventoryItems = (role?: string): NavItem[] => [
  {
    title: "Inventory",
    url: PATH.STUDIO.INVENTORY.ROOT,
    icon: Package,
    items: [
      { title: "All Inventory", url: PATH.STUDIO.INVENTORY.ROOT, icon: Package },
      { title: "Stock", url: `${PATH.STUDIO.INVENTORY.ROOT}?view=stock`, icon: Package },
      { title: "Warehouses", url: PATH.STUDIO.INVENTORY.WAREHOUSES.ROOT, icon: Package },
      { title: "Stock Movements", url: PATH.STUDIO.INVENTORY.MOVEMENTS, icon: Tags },
    ],
  },
];
export const getMarketingItems = (role?: string): NavItem[] => [
  {
    title: "Marketing",
    url: PATH.STUDIO.MARKETING.ROOT,
    icon: MessageSquare,
    items: [
      { title: "All Marketing", url: PATH.STUDIO.MARKETING.ROOT, icon: MessageSquare },
      { title: "Content", url: PATH.STUDIO.MARKETING.CONTENT.ROOT, icon: Layout },
      { title: "Discounts", url: PATH.STUDIO.DISCOUNTS.ROOT, icon: Percent },
      { title: "Coupons", url: PATH.STUDIO.MARKETING.COUPONS.ROOT, icon: Percent },
    ],
  },
];
export const getSettingsItems = (role?: string): NavItem[] => [];
export const getPaymentsItems = (role?: string): NavItem[] => [
  {
    title: "Payments",
    url: PATH.STUDIO.PAYMENT.ROOT,
    icon: CreditCard,
    items: [
      { title: "All Payments", url: PATH.STUDIO.PAYMENT.ROOT, icon: CreditCard },
      { title: "Transactions", url: `${PATH.STUDIO.PAYMENT.ROOT}?status=completed`, icon: CreditCard },
      { title: "Refunds", url: `${PATH.STUDIO.PAYMENT.ROOT}?status=refunded`, icon: CreditCard },
      { title: "Payouts", url: `${PATH.STUDIO.PAYMENT.ROOT}?provider=cod`, icon: CreditCard },
    ],
  },
];
export const getShippingItems = (role?: string): NavItem[] => [
  {
    title: "Shipping",
    url: PATH.STUDIO.SHIPPING.ROOT,
    icon: Truck,
    items: [
      { title: "Shipments", url: PATH.STUDIO.SHIPPING.ROOT, icon: Truck },
      { title: "Providers", url: PATH.STUDIO.SHIPPING.PROVIDERS, icon: Truck },
      { title: "Zones", url: PATH.STUDIO.SHIPPING.ZONES, icon: Truck },
      { title: "Methods", url: PATH.STUDIO.SHIPPING.METHODS, icon: Truck },
      { title: "Rates", url: PATH.STUDIO.SHIPPING.RATES, icon: Truck },
    ],
  },
];
export const getAnalyticsItems = (role?: string): NavItem[] => [];
export const getSupportItems = (role?: string): NavItem[] => [
  {
    title: "Support",
    url: PATH.SITE.SUPPORT.ROOT,
    icon: LifeBuoy,
    items: [
      { title: "Contact Support", url: PATH.SITE.SUPPORT.CONTACT, icon: LifeBuoy },
      { title: "FAQ", url: PATH.SITE.SUPPORT.FAQ, icon: LifeBuoy },
      { title: "Help Center", url: PATH.SITE.SUPPORT.HELP_CENTER, icon: LifeBuoy },
      { title: "Tickets", url: PATH.SITE.SUPPORT.TICKETS.ROOT, icon: LifeBuoy },
    ],
  },
  {
    title: "Feedback",
    url: PATH.SITE.SUPPORT.CONTACT,
    icon: LifeBuoy,
  },
];

export function useSidebarSections(): { sections: NavSection[]; isPending: boolean } {
  const { data: session, isPending } = useSession();
  const role = normalizeRole(session?.user?.role);
  const canSeeStudio = roleCanAccessStudio(role);

  if (isPending || !canSeeStudio) {
    return { sections: [], isPending };
  }

  const catalogSlim: NavItem[] = [
    { title: "Products", url: PATH.STUDIO.PRODUCTS.ROOT, icon: Package },
    { title: "Inventory", url: PATH.STUDIO.INVENTORY.ROOT, icon: Package },
  ];

  const sections: NavSection[] = storefrontFeatures.studioSlimNav
    ? [
        { title: "Dashboard", section: getDashboardItems(role) },
        {
          title: "Studio",
          section: [catalogSlim, getOrdersItems(role)].flat(),
        },
      ]
    : [
        { title: "Dashboard", section: getDashboardItems(role) },
        {
          title: "Studio",
          section: [
            getCatalogItems(role),
            getOrdersItems(role),
            getPaymentsItems(role),
            getCustomersItems(role),
            getInventoryItems(role),
            getShippingItems(role),
          ].flat(),
        },
        {
          title: "Analytics & Marketing",
          section: [getAnalyticsItems(role), getMarketingItems(role)].flat(),
        },
        { title: "Help & Support", section: [getSupportItems(role), getSettingsItems(role)].flat() },
      ];

  return { sections, isPending: false };
}
