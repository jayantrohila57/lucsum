DROP TABLE "return_request" CASCADE;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "verified" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "failed_verification_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "hsn_code";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "gst_rate";--> statement-breakpoint
DROP TYPE "public"."return_request_status";