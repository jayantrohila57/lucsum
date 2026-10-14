import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Canonical Drizzle schema for this app (PostgreSQL).
 *
 * Connection + migrations:
 * - App connection is created in `src/core/db/db.ts` via `drizzle({ client, schema })`.
 * - Drizzle Kit reads this file as the schema source (see `src/core/db/drizzle.ts`).
 *
 * Modeling conventions (critical for integrity + reporting):
 * - IDs are `text` (application-generated).
 * - Timestamps use `timestamptz` (`withTimezone: true`) to avoid regional ambiguity.
 * - Money amounts are `integer` in the smallest currency unit (e.g. paise for INR).
 * - Event/ledger tables are intended to be append-only; prefer inserts over updates/deletes.
 */

export const discountTypeEnum = pgEnum("discount_type", ["flat", "percent"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "razorpay", "paypal", "cod"]);
export const shipmentStatusEnum = pgEnum("shipment_status", [
  "pending",
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "returned",
]);
export const displayTypeEnum = pgEnum("display_type", ["grid", "carousel", "banner", "list", "featured"]);
export const visibilityEnum = pgEnum("visibility", ["public", "private", "hidden"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "archive", "live"]);
export const cookieConsentSourceEnum = pgEnum("cookie_consent_source", ["banner", "account", "sync", "server"]);

// Enterprise enums (single-merchant, company-owned platform)
export const productRelationTypeEnum = pgEnum("product_relation_type", ["related", "cross_sell", "upsell"]);
export const cartAbandonmentEventTypeEnum = pgEnum("cart_abandonment_event_type", [
  "created",
  "updated",
  "abandoned",
  "recovered",
  "notified",
]);
export const loyaltyPointTransactionTypeEnum = pgEnum("loyalty_point_transaction_type", [
  "earn",
  "redeem",
  "adjust",
  "expire",
  "reversal",
]);
export const inventoryAdjustmentTypeEnum = pgEnum("inventory_adjustment_type", [
  "manual",
  "order",
  "restock",
  "return",
  "damaged",
  "correction",
]);
export const auditActorTypeEnum = pgEnum("audit_actor_type", ["user", "system"]);
export const marketingContentPageEnum = pgEnum("marketing_content_page", [
  "home",
  "store",
  "store_category",
  "store_subcategory",
  "product",
  "checkout",
  "about",
  "newsletter",
  "support",
]);
export const marketingContentSectionEnum = pgEnum("marketing_content_section", [
  "promo_banner",
  "cta",
  "offer_banner",
  "crousel",
  "split_banner",
  "announcement_bar",
  "feature_highlight",
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(true),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
});

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  aaguid: text("aaguid"),
});

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});

export const userCookieConsent = pgTable(
  "user_cookie_consent",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    essential: boolean("essential").default(true).notNull(),
    functional: boolean("functional").default(false).notNull(),
    analytics: boolean("analytics").default(false).notNull(),
    marketing: boolean("marketing").default(false).notNull(),
    region: text("region"),
    consentVersion: integer("consent_version").default(1).notNull(),
    source: cookieConsentSourceEnum("source").default("banner").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdUniqueIdx: uniqueIndex("user_cookie_consent_user_id_unique").on(table.userId),
    expiresAtIdx: index("user_cookie_consent_expires_at_idx").on(table.expiresAt),
  }),
);

export const cookieConsentAuditLog = pgTable(
  "cookie_consent_audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    essential: boolean("essential").default(true).notNull(),
    functional: boolean("functional").default(false).notNull(),
    analytics: boolean("analytics").default(false).notNull(),
    marketing: boolean("marketing").default(false).notNull(),
    region: text("region"),
    consentVersion: integer("consent_version").default(1).notNull(),
    source: cookieConsentSourceEnum("source").default("banner").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("cookie_consent_audit_log_user_id_idx").on(table.userId),
    createdAtIdx: index("cookie_consent_audit_log_created_at_idx").on(table.createdAt),
  }),
);

export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    icon: text("icon"),
    title: text("title").notNull(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    displayType: displayTypeEnum("display_type").default("grid").notNull(),
    color: text("color").default("#FFFFFF"),
    visibility: visibilityEnum("visibility").default("public").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    image: text("image"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    visibilityIdx: index("category_visibility_idx").on(table.visibility),
    isFeaturedIdx: index("category_is_featured_idx").on(table.isFeatured),
    displayOrderIdx: index("category_display_order_idx").on(table.displayOrder),
  }),
);

export const subcategory = pgTable(
  "subcategory",
  {
    id: text("id").primaryKey(),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => category.slug),
    slug: text("slug").notNull().unique(),
    icon: text("icon"),
    title: text("title").notNull(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    displayType: displayTypeEnum("display_type").default("grid").notNull(),
    color: text("color").default("#FFFFFF"),
    visibility: visibilityEnum("visibility").default("public").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    image: text("image"),
    /** When set, listing uses product_collection membership for this slug instead of product.subcategory_slug. */
    collectionSlug: text("collection_slug"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    categorySlugIdx: index("subcategory_category_slug_idx").on(table.categorySlug),
    visibilityIdx: index("subcategory_visibility_idx").on(table.visibility),
    isFeaturedIdx: index("subcategory_is_featured_idx").on(table.isFeatured),
    collectionSlugIdx: index("subcategory_collection_slug_idx").on(table.collectionSlug),
  }),
);
export const attribute = pgTable("attribute", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").default("text").notNull(),
  value: text("value").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  alt: text("alt"),
  type: text("type").$type<"image" | "video" | "model" | "file">().default("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const marketingContent = pgTable(
  "marketing_content",
  {
    id: text("id").primaryKey(),
    page: marketingContentPageEnum("page").notNull(),
    section: marketingContentSectionEnum("section").notNull(),
    title: text("title"),
    bodyText: text("body_text"),
    image: text("image"),
    ctaLabel: text("cta_label"),
    ctaLink: text("cta_link"),
    productLink: text("product_link"),
    items:
      jsonb("items").$type<
        {
          title?: string | null;
          bodyText?: string | null;
          image?: string | null;
          ctaLabel?: string | null;
          ctaLink?: string | null;
        }[]
      >(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    pageSectionIdx: index("marketing_content_page_section_idx").on(table.page, table.section),
    isActiveIdx: index("marketing_content_is_active_idx").on(table.isActive),
    displayOrderIdx: index("marketing_content_display_order_idx").on(table.displayOrder),
  }),
);

/** Public marketing signups (footer + newsletter page). */
/** CMS pages and blog articles imported from Shopify (and editable in Studio later). */
export const sitePage = pgTable(
  "site_page",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    kind: text("kind").$type<"page" | "article" | "policy">().notNull(),
    title: text("title").notNull(),
    bodyHtml: text("body_html").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    kindIdx: index("site_page_kind_idx").on(table.kind),
  }),
);

export const newsletterSubscriber = pgTable(
  "newsletter_subscriber",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    source: text("source").default("website").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("newsletter_subscriber_created_at_idx").on(table.createdAt),
  }),
);

export const product = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    slug: text("slug").notNull().unique(),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => category.slug),
    subcategorySlug: text("subcategory_slug")
      .notNull()
      .references(() => subcategory.slug),
    taxClassId: text("tax_class_id").references(() => taxClass.id, { onDelete: "set null" }),
    /** When false, order placement does not require an inventory_item row (e.g. digital goods). */
    tracksInventory: boolean("tracks_inventory").default(true).notNull(),
    basePrice: integer("base_price").notNull(),
    baseCurrency: text("base_currency").default("INR"),
    baseImage: text("base_image"),
    features: json("features").$type<{ title: string }[]>(),
    isActive: boolean("is_active").default(true),
    status: productStatusEnum("status").default("draft").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    categorySlugIdx: index("product_category_slug_idx").on(table.categorySlug),
    subcategorySlugIdx: index("product_subcategory_slug_idx").on(table.subcategorySlug),
    taxClassIdIdx: index("product_tax_class_id_idx").on(table.taxClassId),
    statusIdx: index("product_status_idx").on(table.status),
    isActiveIdx: index("product_is_active_idx").on(table.isActive),
  }),
);

export const productVariant = pgTable(
  "product_variant",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    taxClassId: text("tax_class_id").references(() => taxClass.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    priceModifierType: text("price_modifier_type")
      .$type<"flat_increase" | "flat_decrease" | "percent_increase" | "percent_decrease">()
      .notNull(),
    priceModifierValue: numeric("price_modifier_value", { precision: 10, scale: 2 }).notNull(),
    attributes: json("attributes").$type<{ title: string; type: string; value: string }[]>(),
    media: json("media").$type<{ url: string }[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    productIdIdx: index("product_variant_product_id_idx").on(table.productId),
    taxClassIdIdx: index("product_variant_tax_class_id_idx").on(table.taxClassId),
  }),
);

export const warehouse = pgTable(
  "warehouse",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    state: text("state"),
    city: text("city"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    postalCode: text("postal_code"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    codeIdx: index("warehouse_code_idx").on(table.code),
    isActiveIdx: index("warehouse_is_active_idx").on(table.isActive),
    countryIdx: index("warehouse_country_idx").on(table.country),
  }),
);

export const inventoryItem = pgTable(
  "inventory_item",
  {
    id: text("id").primaryKey(),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
    warehouseId: text("warehouse_id").references(() => warehouse.id, { onDelete: "set null" }),
    sku: text("sku").notNull(),
    barcode: text("barcode"),
    quantity: integer("quantity").notNull().default(0),
    incoming: integer("incoming").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    skuIdx: index("inventory_item_sku_idx").on(table.sku),
    variantIdWarehouseIdx: index("inventory_item_variant_warehouse_idx").on(table.variantId, table.warehouseId),
    variantIdIdx: index("inventory_item_variant_id_idx").on(table.variantId),
  }),
);

export const inventoryReservation = pgTable(
  "inventory_reservation",
  {
    id: text("id").primaryKey(),
    inventoryId: text("inventory_id")
      .notNull()
      .references(() => inventoryItem.id, { onDelete: "cascade" }),
    warehouseId: text("warehouse_id").references(() => warehouse.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    inventoryIdIdx: index("inventory_reservation_inventory_id_idx").on(table.inventoryId),
    warehouseIdIdx: index("inventory_reservation_warehouse_id_idx").on(table.warehouseId),
    userIdIdx: index("inventory_reservation_user_id_idx").on(table.userId),
  }),
);

export const cart = pgTable(
  "cart",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("cart_user_id_idx").on(table.userId),
    sessionIdIdx: index("cart_session_id_idx").on(table.sessionId),
  }),
);

export const cartLine = pgTable(
  "cart_line",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    price: integer("price_snapshot").notNull(),
  },
  (table) => ({
    cartIdIdx: index("cart_line_cart_id_idx").on(table.cartId),
    variantIdIdx: index("cart_line_variant_id_idx").on(table.variantId),
  }),
);

export const wishlist = pgTable(
  "wishlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("wishlist_user_id_idx").on(table.userId),
    variantIdIdx: index("wishlist_variant_id_idx").on(table.variantId),
  }),
);

export const order = pgTable(
  "order",
  {
    id: text("id").primaryKey(),

    // Ownership
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // Status
    status: orderStatusEnum("status").default("pending").notNull(),

    // Monetary snapshot (stored in smallest currency unit, e.g., paise for INR)
    subtotal: integer("subtotal").notNull(),
    discountTotal: integer("discount_total").default(0).notNull(),
    taxTotal: integer("tax_total").default(0).notNull(),
    shippingTotal: integer("shipping_total").default(0).notNull(),
    grandTotal: integer("grand_total").notNull(),

    currency: text("currency").default("INR").notNull(),

    // Shipping configuration snapshot
    shippingProviderId: text("shipping_provider_id").references(() => shippingProvider.id, { onDelete: "set null" }),
    shippingMethodId: text("shipping_method_id").references(() => shippingMethod.id, { onDelete: "set null" }),
    shippingZoneId: text("shipping_zone_id").references(() => shippingZone.id, { onDelete: "set null" }),
    warehouseId: text("warehouse_id").references(() => warehouse.id, { onDelete: "set null" }),

    // Address snapshots (immutable once placed)
    shippingAddress: json("shipping_address")
      .$type<{
        fullName: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
      }>()
      .notNull(),

    billingAddress: json("billing_address").$type<{
      fullName: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone?: string;
    }>(),

    // Metadata
    notes: text("notes"),
    placedAt: timestamp("placed_at", { withTimezone: true }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("order_user_idx").on(table.userId),
    statusIdx: index("order_status_idx").on(table.status),
    placedAtIdx: index("order_placed_at_idx").on(table.placedAt),
    warehouseIdIdx: index("order_warehouse_id_idx").on(table.warehouseId),
  }),
);

export const orderItem = pgTable(
  "order_item",
  {
    id: text("id").primaryKey(),

    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    variantId: text("variant_id")
      .notNull()
      .references(() => productVariant.id),

    productTitle: text("product_title").notNull(),
    variantTitle: text("variant_title").notNull(),

    quantity: integer("quantity").notNull(),

    unitPrice: integer("unit_price").notNull(), // snapshot at time of order
    totalPrice: integer("total_price").notNull(),

    attributes: json("attributes").$type<{ title: string; type: string; value: string }[]>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("order_item_order_idx").on(table.orderId),
    variantIdx: index("order_item_variant_idx").on(table.variantId),
  }),
);

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),

    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    provider: paymentProviderEnum("provider").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),

    amount: integer("amount").notNull(), // in smallest currency unit
    currency: text("currency").default("INR").notNull(),

    providerPaymentId: text("provider_payment_id"),
    providerMetadata: json("provider_metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orderIdIdx: index("payment_order_id_idx").on(table.orderId),
    orderProviderPendingUidx: uniqueIndex("payment_order_provider_pending_uidx")
      .on(table.orderId, table.provider)
      .where(sql`${table.status} = 'pending'`),
  }),
);

export const addressTypeEnum = pgEnum("address_type", ["billing", "shipping"]);

export const address = pgTable("address", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  type: addressTypeEnum("type").notNull(),

  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),

  isDefault: boolean("is_default").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const shipment = pgTable(
  "shipment",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    status: shipmentStatusEnum("status").default("pending").notNull(),
    trackingNumber: text("tracking_number"),
    carrier: text("carrier"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    estimatedDeliveryAt: timestamp("estimated_delivery_at", { withTimezone: true }),
    shippingRate: integer("shipping_rate"), // paise
    weight: numeric("weight", { precision: 10, scale: 2 }),
    notes: text("notes"),
    shippingProviderId: text("shipping_provider_id").references(() => shippingProvider.id, { onDelete: "set null" }),
    shippingMethodId: text("shipping_method_id").references(() => shippingMethod.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orderIdIdx: index("shipment_order_id_idx").on(table.orderId),
    trackingIdx: index("shipment_tracking_idx").on(table.trackingNumber),
  }),
);

export const discount = pgTable("discount", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: discountTypeEnum("type").notNull(),
  value: integer("value").notNull(), // Smallest unit or percentage * 100
  minOrderAmount: integer("min_order_amount").default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderDiscount = pgTable(
  "order_discount",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    discountId: text("discount_id")
      .notNull()
      .references(() => discount.id),
    appliedAmount: integer("applied_amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderDiscountIdx: index("order_discount_composite_idx").on(table.orderId, table.discountId),
  }),
);

export const refundStatusEnum = pgEnum("refund_status", ["pending", "processed", "failed"]);

export const review = pgTable(
  "review",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),

    rating: integer("rating").notNull(), // 1–5
    title: text("title"),
    comment: text("comment"),

    isApproved: boolean("is_approved").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    productIdx: index("review_product_idx").on(table.productId),
    userIdx: index("review_user_idx").on(table.userId),
    ratingIdx: index("review_rating_idx").on(table.rating),
  }),
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),

    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),

    changedBy: text("changed_by"), // userId or system/admin identifier
    reason: text("reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("order_status_history_order_idx").on(table.orderId),
    createdAtIdx: index("order_status_history_created_at_idx").on(table.createdAt),
  }),
);

export const refund = pgTable(
  "refund",
  {
    id: text("id").primaryKey(),

    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    paymentId: text("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "cascade" }),

    amount: integer("amount").notNull(), // smallest currency unit
    currency: text("currency").default("INR").notNull(),

    status: refundStatusEnum("status").default("pending").notNull(),

    reason: text("reason"),

    providerRefundId: text("provider_refund_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orderIdx: index("refund_order_idx").on(table.orderId),
    paymentIdx: index("refund_payment_idx").on(table.paymentId),
    statusIdx: index("refund_status_idx").on(table.status),
  }),
);

/** Shopify-style collection metadata (style, colour, and catalogue groupings). */
export const catalogCollection = pgTable(
  "catalog_collection",
  {
    slug: text("slug").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    titleIdx: index("catalog_collection_title_idx").on(table.title),
  }),
);

export const productCollection = pgTable(
  "product_collection",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    collectionSlug: text("collection_slug")
      .notNull()
      .references(() => catalogCollection.slug, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("product_collection_product_idx").on(table.productId),
    collectionIdx: index("product_collection_collection_idx").on(table.collectionSlug),
    uniqueMembership: uniqueIndex("product_collection_unique").on(table.productId, table.collectionSlug),
  }),
);

// =================================================
// Enterprise e-commerce extensions (single-merchant)
// =================================================

// --- Tax configuration (multi-region, tax classes) ---
// Design notes:
// - Zone matching is intentionally flexible (country/region/city/postal patterns); the
//   "best" zone/rule selection logic should live in application code using priority.
// - Tax rules are effective-dated; prefer creating a new rule over mutating an old one
//   to preserve historical tax logic for reporting and auditability.

export const taxClass = pgTable(
  "tax_class",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    codeIdx: index("tax_class_code_idx").on(table.code),
    isDefaultIdx: index("tax_class_is_default_idx").on(table.isDefault),
  }),
);

export const taxZone = pgTable(
  "tax_zone",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    countryCode: text("country_code").notNull(), // ISO 3166-1 alpha-2/3 (app-level validation)
    regionCode: text("region_code"), // e.g. ISO 3166-2 subdivision
    city: text("city"),
    postalCodePattern: text("postal_code_pattern"), // regex/pattern (app-level interpretation)
    postalCodeFrom: text("postal_code_from"),
    postalCodeTo: text("postal_code_to"),
    priority: integer("priority").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    countryRegionIdx: index("tax_zone_country_region_idx").on(table.countryCode, table.regionCode),
    activePriorityIdx: index("tax_zone_active_priority_idx").on(table.isActive, table.priority),
  }),
);

export const taxRule = pgTable(
  "tax_rule",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    zoneId: text("zone_id")
      .notNull()
      .references(() => taxZone.id, { onDelete: "restrict" }),
    taxClassId: text("tax_class_id")
      .notNull()
      .references(() => taxClass.id, { onDelete: "restrict" }),
    // Fractional rate (not percent). Example: 0.1800 = 18%
    rate: numeric("rate", { precision: 7, scale: 4 }).notNull(),
    isCompound: boolean("is_compound").default(false).notNull(),
    appliesToShipping: boolean("applies_to_shipping").default(false).notNull(),
    priority: integer("priority").default(0).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).defaultNow().notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    zoneIdx: index("tax_rule_zone_idx").on(table.zoneId),
    taxClassIdx: index("tax_rule_tax_class_idx").on(table.taxClassId),
    activeEffectiveIdx: index("tax_rule_active_effective_idx").on(table.isActive, table.effectiveFrom),
    zoneClassEffectiveIdx: index("tax_rule_zone_class_effective_idx").on(
      table.zoneId,
      table.taxClassId,
      table.effectiveFrom,
    ),
  }),
);

// --- Shipping configuration: providers, methods, simple zones, flat rates ---
// Design notes:
// - Providers represent carriers or delivery partners (e.g. BlueDart, Delhivery).
// - Methods are service levels per provider (e.g. Standard, Express, COD).
// - Zones are intentionally simple (country/state) for v1; application code can
//   pick the best matching zone based on the order's shipping address.
// - Rate rules are flat amounts per method+zone, stored in smallest currency unit.

export const shippingProvider = pgTable(
  "shipping_provider",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    codeIdx: index("shipping_provider_code_idx").on(table.code),
    isActiveIdx: index("shipping_provider_is_active_idx").on(table.isActive),
  }),
);

export const shippingMethod = pgTable(
  "shipping_method",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => shippingProvider.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    providerCodeIdx: index("shipping_method_provider_code_idx").on(table.providerId, table.code),
    isActiveIdx: index("shipping_method_is_active_idx").on(table.isActive),
  }),
);

export const shippingZone = pgTable(
  "shipping_zone",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    countryCode: text("country_code").notNull(),
    regionCode: text("region_code"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    countryRegionIdx: index("shipping_zone_country_region_idx").on(table.countryCode, table.regionCode),
    isActiveIdx: index("shipping_zone_is_active_idx").on(table.isActive),
  }),
);

export const shippingRateRule = pgTable(
  "shipping_rate_rule",
  {
    id: text("id").primaryKey(),
    methodId: text("method_id")
      .notNull()
      .references(() => shippingMethod.id, { onDelete: "cascade" }),
    zoneId: text("zone_id")
      .notNull()
      .references(() => shippingZone.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    methodZoneIdx: index("shipping_rate_rule_method_zone_idx").on(table.methodId, table.zoneId),
    isActiveIdx: index("shipping_rate_rule_is_active_idx").on(table.isActive),
  }),
);

// --- Product relationships: related/cross-sell/upsell + bundles ---
// `product_relation` is directional (source → target). If you need symmetric "related"
// behavior in your storefront, insert both directions at write-time.

export const productRelation = pgTable(
  "product_relation",
  {
    id: text("id").primaryKey(),
    type: productRelationTypeEnum("type").notNull(),
    sourceProductId: text("source_product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    targetProductId: text("target_product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index("product_relation_source_idx").on(table.sourceProductId),
    targetIdx: index("product_relation_target_idx").on(table.targetProductId),
    typeIdx: index("product_relation_type_idx").on(table.type),
    sourceTypeOrderIdx: index("product_relation_source_type_order_idx").on(
      table.sourceProductId,
      table.type,
      table.sortOrder,
    ),
    uniqueRelation: uniqueIndex("product_relation_unique").on(table.type, table.sourceProductId, table.targetProductId),
  }),
);

export const productBundleItem = pgTable(
  "product_bundle_item",
  {
    id: text("id").primaryKey(),
    bundleProductId: text("bundle_product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    componentVariantId: text("component_variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "restrict" }),
    quantity: integer("quantity").default(1).notNull(),
    isOptional: boolean("is_optional").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    bundleIdx: index("product_bundle_item_bundle_idx").on(table.bundleProductId),
    componentVariantIdx: index("product_bundle_item_component_variant_idx").on(table.componentVariantId),
    bundleOrderIdx: index("product_bundle_item_bundle_order_idx").on(table.bundleProductId, table.sortOrder),
    uniqueBundleComponent: uniqueIndex("product_bundle_item_unique").on(
      table.bundleProductId,
      table.componentVariantId,
    ),
  }),
);

// --- Loyalty & rewards: tiers, accounts, immutable ledger ---
// Design notes:
// - `loyalty_point_transaction` is the source of truth (append-only ledger).
// - `loyalty_account.points_balance` and lifetime counters are denormalized caches for
//   fast reads; keep them consistent transactionally in application code.

export const loyaltyTier = pgTable(
  "loyalty_tier",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    minLifetimePoints: integer("min_lifetime_points").default(0).notNull(),
    earnMultiplier: numeric("earn_multiplier", { precision: 6, scale: 4 }).default("1.0000").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    codeIdx: index("loyalty_tier_code_idx").on(table.code),
    minLifetimeIdx: index("loyalty_tier_min_lifetime_idx").on(table.minLifetimePoints),
    isActiveIdx: index("loyalty_tier_is_active_idx").on(table.isActive),
  }),
);

export const loyaltyAccount = pgTable(
  "loyalty_account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    tierId: text("tier_id").references(() => loyaltyTier.id, { onDelete: "set null" }),
    pointsBalance: integer("points_balance").default(0).notNull(),
    lockedPoints: integer("locked_points").default(0).notNull(),
    lifetimePointsEarned: integer("lifetime_points_earned").default(0).notNull(),
    lifetimePointsRedeemed: integer("lifetime_points_redeemed").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("loyalty_account_user_idx").on(table.userId),
    tierIdx: index("loyalty_account_tier_idx").on(table.tierId),
    pointsBalanceIdx: index("loyalty_account_points_balance_idx").on(table.pointsBalance),
  }),
);

export const loyaltyPointTransaction = pgTable(
  "loyalty_point_transaction",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => loyaltyAccount.id, { onDelete: "cascade" }),
    type: loyaltyPointTransactionTypeEnum("type").notNull(),
    // Signed points: +earn/+adjust, -redeem/-expire/-reversal.
    points: integer("points").notNull(),
    orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
    orderItemId: text("order_item_id").references(() => orderItem.id, { onDelete: "set null" }),
    refundId: text("refund_id").references(() => refund.id, { onDelete: "set null" }),
    currency: text("currency").default("INR").notNull(),
    baseAmount: integer("base_amount"), // amount used to compute points (smallest unit)
    rateApplied: numeric("rate_applied", { precision: 10, scale: 6 }), // points per currency unit or multiplier snapshot
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    accountIdx: index("loyalty_point_transaction_account_idx").on(table.accountId),
    typeIdx: index("loyalty_point_transaction_type_idx").on(table.type),
    createdAtIdx: index("loyalty_point_transaction_created_at_idx").on(table.createdAt),
    orderIdx: index("loyalty_point_transaction_order_idx").on(table.orderId),
    expiresAtIdx: index("loyalty_point_transaction_expires_at_idx").on(table.expiresAt),
  }),
);

// --- Cart abandonment tracking (marketing automation) ---
// `cart_abandonment` stores the latest state for quick segmentation; use
// `cart_abandonment_event` (append-only) for journeys, attribution, and analytics.

export const cartAbandonment = pgTable(
  "cart_abandonment",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" })
      .unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionId: text("session_id"),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    recoveredAt: timestamp("recovered_at", { withTimezone: true }),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    notificationCount: integer("notification_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    cartIdx: index("cart_abandonment_cart_idx").on(table.cartId),
    userIdx: index("cart_abandonment_user_idx").on(table.userId),
    abandonedAtIdx: index("cart_abandonment_abandoned_at_idx").on(table.abandonedAt),
  }),
);

export const cartAbandonmentEvent = pgTable(
  "cart_abandonment_event",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionId: text("session_id"),
    type: cartAbandonmentEventTypeEnum("type").notNull(),
    channel: text("channel"), // email/sms/push/etc
    email: text("email"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    cartIdx: index("cart_abandonment_event_cart_idx").on(table.cartId),
    userIdx: index("cart_abandonment_event_user_idx").on(table.userId),
    typeIdx: index("cart_abandonment_event_type_idx").on(table.type),
    occurredAtIdx: index("cart_abandonment_event_occurred_at_idx").on(table.occurredAt),
    cartOccurredIdx: index("cart_abandonment_event_cart_occurred_idx").on(table.cartId, table.occurredAt),
  }),
);

// --- Product view analytics (scalable event model) ---
// Privacy note: prefer storing a hash in `ip_hash` instead of raw IP addresses.

export const analyticsSession = pgTable(
  "analytics_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    anonymousId: text("anonymous_id"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("analytics_session_user_idx").on(table.userId),
    anonymousIdx: index("analytics_session_anonymous_idx").on(table.anonymousId),
    startedAtIdx: index("analytics_session_started_at_idx").on(table.startedAt),
  }),
);

export const productViewEvent = pgTable(
  "product_view_event",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").references(() => analyticsSession.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariant.id, { onDelete: "set null" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
    pageUrl: text("page_url"),
    referrer: text("referrer"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    productViewedIdx: index("product_view_event_product_viewed_idx").on(table.productId, table.viewedAt),
    sessionViewedIdx: index("product_view_event_session_viewed_idx").on(table.sessionId, table.viewedAt),
    userViewedIdx: index("product_view_event_user_viewed_idx").on(table.userId, table.viewedAt),
    viewedAtIdx: index("product_view_event_viewed_at_idx").on(table.viewedAt),
  }),
);

// --- Audit logging + immutable operational events for reporting ---
// - `audit_log` is a flexible JSONB-based trail. Ensure `before/after` payloads are
//   sanitized (avoid secrets/PII beyond what's required).
// - Domain event tables below are append-only and optimized for reporting on:
//   price changes, inventory adjustments, and discount usage.

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorType: auditActorTypeEnum("actor_type").default("system").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g. product.price.updated
    entityType: text("entity_type").notNull(), // e.g. product/product_variant/inventory_item/discount
    entityId: text("entity_id").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actorIdx: index("audit_log_actor_idx").on(table.actorUserId),
    entityIdx: index("audit_log_entity_idx").on(table.entityType, table.entityId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
    requestIdIdx: index("audit_log_request_id_idx").on(table.requestId),
  }),
);

export const priceChangeEvent = pgTable(
  "price_change_event",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => product.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariant.id, { onDelete: "set null" }),
    currency: text("currency").default("INR").notNull(),
    oldPrice: integer("old_price").notNull(),
    newPrice: integer("new_price").notNull(),
    changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }),
    reason: text("reason"),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    productEffectiveIdx: index("price_change_event_product_effective_idx").on(table.productId, table.effectiveAt),
    variantEffectiveIdx: index("price_change_event_variant_effective_idx").on(table.variantId, table.effectiveAt),
    createdAtIdx: index("price_change_event_created_at_idx").on(table.createdAt),
  }),
);

export const inventoryAdjustmentEvent = pgTable(
  "inventory_adjustment_event",
  {
    id: text("id").primaryKey(),
    type: inventoryAdjustmentTypeEnum("type").default("manual").notNull(),
    inventoryId: text("inventory_id")
      .notNull()
      .references(() => inventoryItem.id, { onDelete: "cascade" }),
    warehouseId: text("warehouse_id").references(() => warehouse.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariant.id, { onDelete: "set null" }),
    quantityBefore: integer("quantity_before"),
    quantityDelta: integer("quantity_delta").default(0).notNull(),
    quantityAfter: integer("quantity_after"),
    incomingBefore: integer("incoming_before"),
    incomingDelta: integer("incoming_delta").default(0).notNull(),
    incomingAfter: integer("incoming_after"),
    reservedBefore: integer("reserved_before"),
    reservedDelta: integer("reserved_delta").default(0).notNull(),
    reservedAfter: integer("reserved_after"),
    orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
    refundId: text("refund_id").references(() => refund.id, { onDelete: "set null" }),
    reason: text("reason"),
    adjustedBy: text("adjusted_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    inventoryIdx: index("inventory_adjustment_event_inventory_idx").on(table.inventoryId),
    warehouseIdx: index("inventory_adjustment_event_warehouse_idx").on(table.warehouseId),
    variantIdx: index("inventory_adjustment_event_variant_idx").on(table.variantId),
    orderIdx: index("inventory_adjustment_event_order_idx").on(table.orderId),
    createdAtIdx: index("inventory_adjustment_event_created_at_idx").on(table.createdAt),
  }),
);

export const discountUsageEvent = pgTable(
  "discount_usage_event",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    discountId: text("discount_id")
      .notNull()
      .references(() => discount.id, { onDelete: "restrict" }),
    orderDiscountId: text("order_discount_id").references(() => orderDiscount.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    currency: text("currency").default("INR").notNull(),
    appliedAmount: integer("applied_amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("discount_usage_event_order_idx").on(table.orderId),
    discountIdx: index("discount_usage_event_discount_idx").on(table.discountId),
    discountCreatedIdx: index("discount_usage_event_discount_created_idx").on(table.discountId, table.createdAt),
    userIdx: index("discount_usage_event_user_idx").on(table.userId),
  }),
);

/////////////////////////////////////////////////

export const reviewRelations = relations(review, ({ one }) => ({
  user: one(user, {
    fields: [review.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [review.productId],
    references: [product.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(order, {
    fields: [orderStatusHistory.orderId],
    references: [order.id],
  }),
}));

export const refundRelations = relations(refund, ({ one }) => ({
  order: one(order, {
    fields: [refund.orderId],
    references: [order.id],
  }),
  payment: one(payment, {
    fields: [refund.paymentId],
    references: [payment.id],
  }),
}));

export const shipmentRelations = relations(shipment, ({ one }) => ({
  order: one(order, {
    fields: [shipment.orderId],
    references: [order.id],
  }),
}));

export const discountRelations = relations(discount, ({ many }) => ({
  orders: many(orderDiscount),
}));

export const orderDiscountRelations = relations(orderDiscount, ({ one }) => ({
  order: one(order, {
    fields: [orderDiscount.orderId],
    references: [order.id],
  }),
  discount: one(discount, {
    fields: [orderDiscount.discountId],
    references: [discount.id],
  }),
}));

export const taxClassRelations = relations(taxClass, ({ many }) => ({
  rules: many(taxRule),
  products: many(product),
  variants: many(productVariant),
}));

export const taxZoneRelations = relations(taxZone, ({ many }) => ({
  rules: many(taxRule),
}));

export const taxRuleRelations = relations(taxRule, ({ one }) => ({
  zone: one(taxZone, {
    fields: [taxRule.zoneId],
    references: [taxZone.id],
  }),
  taxClass: one(taxClass, {
    fields: [taxRule.taxClassId],
    references: [taxClass.id],
  }),
}));

export const shippingProviderRelations = relations(shippingProvider, ({ many }) => ({
  methods: many(shippingMethod),
}));

export const shippingMethodRelations = relations(shippingMethod, ({ one, many }) => ({
  provider: one(shippingProvider, {
    fields: [shippingMethod.providerId],
    references: [shippingProvider.id],
  }),
  rates: many(shippingRateRule),
}));

export const shippingZoneRelations = relations(shippingZone, ({ many }) => ({
  rates: many(shippingRateRule),
}));

export const shippingRateRuleRelations = relations(shippingRateRule, ({ one }) => ({
  method: one(shippingMethod, {
    fields: [shippingRateRule.methodId],
    references: [shippingMethod.id],
  }),
  zone: one(shippingZone, {
    fields: [shippingRateRule.zoneId],
    references: [shippingZone.id],
  }),
}));

// Self-relations require explicit `relationName` to disambiguate joins in Drizzle's
// relational API (`db.query.*`). This enables querying both outgoing + incoming edges.
export const productRelationRelations = relations(productRelation, ({ one }) => ({
  sourceProduct: one(product, {
    fields: [productRelation.sourceProductId],
    references: [product.id],
    relationName: "product_relation_source",
  }),
  targetProduct: one(product, {
    fields: [productRelation.targetProductId],
    references: [product.id],
    relationName: "product_relation_target",
  }),
}));

export const productBundleItemRelations = relations(productBundleItem, ({ one }) => ({
  bundleProduct: one(product, {
    fields: [productBundleItem.bundleProductId],
    references: [product.id],
  }),
  componentVariant: one(productVariant, {
    fields: [productBundleItem.componentVariantId],
    references: [productVariant.id],
  }),
}));

export const loyaltyTierRelations = relations(loyaltyTier, ({ many }) => ({
  accounts: many(loyaltyAccount),
}));

export const loyaltyAccountRelations = relations(loyaltyAccount, ({ one, many }) => ({
  user: one(user, {
    fields: [loyaltyAccount.userId],
    references: [user.id],
  }),
  tier: one(loyaltyTier, {
    fields: [loyaltyAccount.tierId],
    references: [loyaltyTier.id],
  }),
  transactions: many(loyaltyPointTransaction),
}));

export const loyaltyPointTransactionRelations = relations(loyaltyPointTransaction, ({ one }) => ({
  account: one(loyaltyAccount, {
    fields: [loyaltyPointTransaction.accountId],
    references: [loyaltyAccount.id],
  }),
  order: one(order, {
    fields: [loyaltyPointTransaction.orderId],
    references: [order.id],
  }),
  orderItem: one(orderItem, {
    fields: [loyaltyPointTransaction.orderItemId],
    references: [orderItem.id],
  }),
  refund: one(refund, {
    fields: [loyaltyPointTransaction.refundId],
    references: [refund.id],
  }),
}));

export const cartAbandonmentRelations = relations(cartAbandonment, ({ one }) => ({
  cart: one(cart, {
    fields: [cartAbandonment.cartId],
    references: [cart.id],
  }),
  user: one(user, {
    fields: [cartAbandonment.userId],
    references: [user.id],
  }),
}));

export const cartAbandonmentEventRelations = relations(cartAbandonmentEvent, ({ one }) => ({
  cart: one(cart, {
    fields: [cartAbandonmentEvent.cartId],
    references: [cart.id],
  }),
  user: one(user, {
    fields: [cartAbandonmentEvent.userId],
    references: [user.id],
  }),
}));

export const analyticsSessionRelations = relations(analyticsSession, ({ one, many }) => ({
  user: one(user, {
    fields: [analyticsSession.userId],
    references: [user.id],
  }),
  productViews: many(productViewEvent),
}));

export const productViewEventRelations = relations(productViewEvent, ({ one }) => ({
  session: one(analyticsSession, {
    fields: [productViewEvent.sessionId],
    references: [analyticsSession.id],
  }),
  user: one(user, {
    fields: [productViewEvent.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [productViewEvent.productId],
    references: [product.id],
  }),
  variant: one(productVariant, {
    fields: [productViewEvent.variantId],
    references: [productVariant.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actorUser: one(user, {
    fields: [auditLog.actorUserId],
    references: [user.id],
  }),
}));

export const priceChangeEventRelations = relations(priceChangeEvent, ({ one }) => ({
  product: one(product, {
    fields: [priceChangeEvent.productId],
    references: [product.id],
  }),
  variant: one(productVariant, {
    fields: [priceChangeEvent.variantId],
    references: [productVariant.id],
  }),
  changedByUser: one(user, {
    fields: [priceChangeEvent.changedBy],
    references: [user.id],
  }),
}));

export const warehouseRelations = relations(warehouse, ({ many }) => ({
  inventoryItems: many(inventoryItem),
  reservations: many(inventoryReservation),
  adjustmentEvents: many(inventoryAdjustmentEvent),
  orders: many(order),
}));

export const inventoryAdjustmentEventRelations = relations(inventoryAdjustmentEvent, ({ one }) => ({
  inventory: one(inventoryItem, {
    fields: [inventoryAdjustmentEvent.inventoryId],
    references: [inventoryItem.id],
  }),
  warehouse: one(warehouse, {
    fields: [inventoryAdjustmentEvent.warehouseId],
    references: [warehouse.id],
  }),
  variant: one(productVariant, {
    fields: [inventoryAdjustmentEvent.variantId],
    references: [productVariant.id],
  }),
  order: one(order, {
    fields: [inventoryAdjustmentEvent.orderId],
    references: [order.id],
  }),
  refund: one(refund, {
    fields: [inventoryAdjustmentEvent.refundId],
    references: [refund.id],
  }),
  adjustedByUser: one(user, {
    fields: [inventoryAdjustmentEvent.adjustedBy],
    references: [user.id],
  }),
}));

export const discountUsageEventRelations = relations(discountUsageEvent, ({ one }) => ({
  order: one(order, {
    fields: [discountUsageEvent.orderId],
    references: [order.id],
  }),
  discount: one(discount, {
    fields: [discountUsageEvent.discountId],
    references: [discount.id],
  }),
  user: one(user, {
    fields: [discountUsageEvent.userId],
    references: [user.id],
  }),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  taxClass: one(taxClass, {
    fields: [product.taxClassId],
    references: [taxClass.id],
  }),
  variants: many(productVariant),
  reviews: many(review),
  outgoingProductRelations: many(productRelation, { relationName: "product_relation_source" }),
  incomingProductRelations: many(productRelation, { relationName: "product_relation_target" }),
  bundleItems: many(productBundleItem),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  subcategories: many(subcategory),
}));

export const subcategoryRelations = relations(subcategory, ({ one }) => ({
  category: one(category, {
    fields: [subcategory.categorySlug],
    references: [category.slug],
  }),
}));

export const inventoryItemRelations = relations(inventoryItem, ({ one, many }) => ({
  variant: one(productVariant, {
    fields: [inventoryItem.variantId],
    references: [productVariant.id],
  }),
  warehouse: one(warehouse, {
    fields: [inventoryItem.warehouseId],
    references: [warehouse.id],
  }),
  reservations: many(inventoryReservation),
}));

export const inventoryReservationRelations = relations(inventoryReservation, ({ one }) => ({
  inventory: one(inventoryItem, {
    fields: [inventoryReservation.inventoryId],
    references: [inventoryItem.id],
  }),
  warehouse: one(warehouse, {
    fields: [inventoryReservation.warehouseId],
    references: [warehouse.id],
  }),
}));

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, {
    fields: [cart.userId],
    references: [user.id],
  }),
  abandonment: one(cartAbandonment, {
    fields: [cart.id],
    references: [cartAbandonment.cartId],
  }),
  abandonmentEvents: many(cartAbandonmentEvent),
  lines: many(cartLine),
}));

export const cartLineRelations = relations(cartLine, ({ one }) => ({
  cart: one(cart, {
    fields: [cartLine.cartId],
    references: [cart.id],
  }),
  variant: one(productVariant, {
    fields: [cartLine.variantId],
    references: [productVariant.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(user, {
    fields: [wishlist.userId],
    references: [user.id],
  }),
  variant: one(productVariant, {
    fields: [wishlist.variantId],
    references: [productVariant.id],
  }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  warehouse: one(warehouse, {
    fields: [order.warehouseId],
    references: [warehouse.id],
  }),
  items: many(orderItem),
  payments: many(payment),
  shipments: many(shipment),
  discounts: many(orderDiscount),
  statusHistory: many(orderStatusHistory),
  refunds: many(refund),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  variant: one(productVariant, {
    fields: [orderItem.variantId],
    references: [productVariant.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
  order: one(order, {
    fields: [payment.orderId],
    references: [order.id],
  }),
  refunds: many(refund),
}));

export const addressRelations = relations(address, ({ one }) => ({
  user: one(user, {
    fields: [address.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  accounts: many(account),
  sessions: many(session),
  orders: many(order),
  addresses: many(address),
  carts: many(cart),
  wishlists: many(wishlist),
  reviews: many(review),
  loyaltyAccount: one(loyaltyAccount, {
    fields: [user.id],
    references: [loyaltyAccount.userId],
  }),
  analyticsSessions: many(analyticsSession),
  cartAbandonments: many(cartAbandonment),
}));

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
  taxClass: one(taxClass, {
    fields: [productVariant.taxClassId],
    references: [taxClass.id],
  }),
  inventory: one(inventoryItem, {
    fields: [productVariant.id],
    references: [inventoryItem.variantId],
  }),
  cartLines: many(cartLine),
  wishlists: many(wishlist),
  orderItems: many(orderItem),
  bundleComponents: many(productBundleItem),
  viewEvents: many(productViewEvent),
}));
