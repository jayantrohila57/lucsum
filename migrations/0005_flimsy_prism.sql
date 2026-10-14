CREATE TABLE "catalog_collection" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"collection_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subcategory" ADD COLUMN "collection_slug" text;--> statement-breakpoint
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_collection_slug_catalog_collection_slug_fk" FOREIGN KEY ("collection_slug") REFERENCES "public"."catalog_collection"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_collection_title_idx" ON "catalog_collection" USING btree ("title");--> statement-breakpoint
CREATE INDEX "product_collection_product_idx" ON "product_collection" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_collection_collection_idx" ON "product_collection" USING btree ("collection_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "product_collection_unique" ON "product_collection" USING btree ("product_id","collection_slug");--> statement-breakpoint
CREATE INDEX "subcategory_collection_slug_idx" ON "subcategory" USING btree ("collection_slug");
