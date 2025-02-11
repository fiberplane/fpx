/*
We want to delete PRIMARY KEY(handler_type,method,path,route_origin) from 'app_routes' table
SQLite does not supportprimary key deletion from existing table
We can do it in 3 steps with drizzle orm:
 - create new mirror table table without pk, rename current table to old_table, generate SQL
 - migrate old data from one table to another
 - delete old_table in schema, generate sql
*/
ALTER TABLE `app_routes` RENAME TO `old_app_routes`;
--> statement-breakpoint
CREATE TABLE `app_routes` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `path` TEXT,
  `method` TEXT,
  `handler` TEXT,
  `handler_type` TEXT,
  `currentlyRegistered` INTEGER DEFAULT false,
  `registration_order` INTEGER DEFAULT -1,
  `route_origin` TEXT DEFAULT 'discovered',
  `openapi_spec` TEXT,
  `request_type` TEXT DEFAULT 'http'
);
--> statement-breakpoint
INSERT INTO `app_routes` (`path`, `method`, `handler`, `handler_type`, `currentlyRegistered`, `registration_order`, `route_origin`, `openapi_spec`, `request_type`)
SELECT `path`, `method`, `handler`, `handler_type`, `currentlyRegistered`, `registration_order`, `route_origin`, `openapi_spec`, `request_type`
FROM `old_app_routes`;
--> statement-breakpoint
DROP TABLE `old_app_routes`;