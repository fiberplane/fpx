CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text,
	`data` text,
	`type` text DEFAULT 'success',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
