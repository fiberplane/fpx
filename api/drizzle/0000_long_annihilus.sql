CREATE TABLE `app_requests` (
	`id` integer PRIMARY KEY NOT NULL,
	`request_method` text NOT NULL,
	`request_url` text NOT NULL,
	`request_headers` text,
	`request_query_params` text,
	`request_body` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_responses` (
	`id` integer PRIMARY KEY NOT NULL,
	`trace_id` text NOT NULL,
	`response_status_code` integer,
	`response_time` integer,
	`response_headers` text,
	`response_body` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`request_id` integer,
	FOREIGN KEY (`request_id`) REFERENCES `app_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_routes` (
	`path` text,
	`method` text,
	`handler` text,
	PRIMARY KEY(`method`, `path`)
);
--> statement-breakpoint
CREATE TABLE `github_issues` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`url` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body` text,
	`state` text NOT NULL,
	`type` text NOT NULL,
	`labels` text,
	`created_at` text,
	`updated_at` text,
	`closed_at` text
);
--> statement-breakpoint
CREATE TABLE `mizu_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`level` text,
	`timestamp` text,
	`trace_id` text,
	`service` text,
	`message` text,
	`ignored` integer DEFAULT false,
	`args` text,
	`caller_location` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`matching_issues` text
);
