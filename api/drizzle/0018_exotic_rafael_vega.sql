CREATE TABLE `ai_request_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
