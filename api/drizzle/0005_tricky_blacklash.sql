ALTER TABLE `app_routes` ADD `request_type` text DEFAULT 'http';--> statement-breakpoint
ALTER TABLE `app_routes` DROP COLUMN `is_ws`;