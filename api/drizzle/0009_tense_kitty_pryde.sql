ALTER TABLE `settings` ADD `key` text NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `value` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `content`;