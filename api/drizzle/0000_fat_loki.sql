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
