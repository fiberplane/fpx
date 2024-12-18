PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_request_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_ai_request_logs`("id", "log", "created_at") SELECT "id", "log", "created_at" FROM `ai_request_logs`;--> statement-breakpoint
DROP TABLE `ai_request_logs`;--> statement-breakpoint
ALTER TABLE `__new_ai_request_logs` RENAME TO `ai_request_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "key", "value", "created_at", "updated_at") SELECT "id", "key", "value", "created_at", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `__new_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`value` text NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tokens`("id", "value", "expires_at", "created_at", "updated_at") SELECT "id", "value", "expires_at", "created_at", "updated_at" FROM `tokens`;--> statement-breakpoint
DROP TABLE `tokens`;--> statement-breakpoint
ALTER TABLE `__new_tokens` RENAME TO `tokens`;--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_value_unique` ON `tokens` (`value`);