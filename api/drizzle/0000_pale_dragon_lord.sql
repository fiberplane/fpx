DO $$ BEGIN
 CREATE TYPE "public"."severity" AS ENUM('error', 'warning', 'info');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mizu_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"severity" "severity",
	"message" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
