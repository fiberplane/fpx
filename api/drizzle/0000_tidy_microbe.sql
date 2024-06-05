CREATE TABLE `github_issues` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`url` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body` text,
	`state` text NOT NULL,
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
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
