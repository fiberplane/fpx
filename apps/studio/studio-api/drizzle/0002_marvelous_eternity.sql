ALTER TABLE `app_routes` ADD `route_origin` text DEFAULT 'discovered';--> statement-breakpoint
ALTER TABLE `app_routes` ADD `openapi_spec` text;--> statement-breakpoint
ALTER TABLE `app_routes` DROP COLUMN `addedByUser`;