CREATE TABLE "site_page" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body_html" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "site_page_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "site_page_kind_idx" ON "site_page" USING btree ("kind");