PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_app_requests` (
	`id` integer PRIMARY KEY NOT NULL,
	`request_method` text NOT NULL,
	`request_url` text NOT NULL,
	`request_headers` text,
	`request_query_params` text,
	`request_path_params` text,
	`request_body` text,
	`request_route` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_app_requests`("id", "request_method", "request_url", "request_headers", "request_query_params", "request_path_params", "request_body", "request_route", "created_at", "updated_at") SELECT "id", "request_method", "request_url", "request_headers", "request_query_params", "request_path_params", "request_body", "request_route", "created_at", "updated_at" FROM `app_requests`;--> statement-breakpoint
DROP TABLE `app_requests`;--> statement-breakpoint
ALTER TABLE `__new_app_requests` RENAME TO `app_requests`;--> statement-breakpoint
PRAGMA foreign_keys=ON;