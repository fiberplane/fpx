ALTER TABLE `app_responses` ADD `failure_reason` text;--> statement-breakpoint
ALTER TABLE `app_responses` ADD `failure_details` text;--> statement-breakpoint
ALTER TABLE `app_responses` ADD `is_failure` integer DEFAULT false;