ALTER TYPE "severity" RENAME TO "level"; --> I added this myself sorry if it breaks things for you but it shouldn't
ALTER TYPE "level" ADD VALUE 'debug';--> statement-breakpoint
ALTER TABLE "mizu_logs" ADD COLUMN "ignored" boolean DEFAULT false;