CREATE TABLE `goose_images` (
	`id` integer PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`prompt` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
