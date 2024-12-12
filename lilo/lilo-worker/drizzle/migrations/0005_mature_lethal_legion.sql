ALTER TABLE `users` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `token`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `refresh_token`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `session_token`;