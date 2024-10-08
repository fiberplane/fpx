CREATE TABLE `stuff` (
	`id` integer PRIMARY KEY NOT NULL,
	`foo` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
