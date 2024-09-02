CREATE TABLE `geese` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
