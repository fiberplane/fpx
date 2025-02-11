DROP TABLE `mizu_logs`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_app_responses` (
	`id` integer PRIMARY KEY NOT NULL,
	`trace_id` text NOT NULL,
	`response_status_code` integer,
	`response_time` integer,
	`response_headers` text,
	`response_body` text,
	`failure_reason` text,
	`failure_details` text,
	`is_failure` integer DEFAULT false,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`request_id` integer,
	FOREIGN KEY (`request_id`) REFERENCES `app_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_app_responses`("id", "trace_id", "response_status_code", "response_time", "response_headers", "response_body", "failure_reason", "failure_details", "is_failure", "created_at", "updated_at", "request_id") SELECT "id", "trace_id", "response_status_code", "response_time", "response_headers", "response_body", "failure_reason", "failure_details", "is_failure", "created_at", "updated_at", "request_id" FROM `app_responses`;--> statement-breakpoint
DROP TABLE `app_responses`;--> statement-breakpoint
ALTER TABLE `__new_app_responses` RENAME TO `app_responses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;