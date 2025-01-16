CREATE TABLE `oai_schema` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`summary` text,
	`description` text,
	`oai_schema_id` text,
	`arazzo_schema` text,
	`prompt` text NOT NULL,
	`steps` text NOT NULL,
	`last_run_status` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`oai_schema_id`) REFERENCES `oai_schema`(`id`) ON UPDATE no action ON DELETE no action
);
