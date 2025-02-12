CREATE TABLE `otel_traces` (
	`trace_id` text,
	`raw_payload` text,
	`parsed_payload` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
