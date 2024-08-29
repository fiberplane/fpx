CREATE TABLE IF NOT EXISTS "geese" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_leader" boolean,
	"programming_language" text,
	"motivations" jsonb,
	"location" text,
	"bio" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
