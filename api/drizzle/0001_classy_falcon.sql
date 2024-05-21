ALTER TABLE "mizu_logs" RENAME COLUMN "severity" TO "level";--> statement-breakpoint
ALTER TABLE "mizu_logs" ADD COLUMN "service" text;--> statement-breakpoint
ALTER TABLE "mizu_logs" ADD COLUMN "args" jsonb;