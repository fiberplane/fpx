ALTER TABLE `otel_traces` RENAME TO `otel_spans`;--> statement-breakpoint
ALTER TABLE `otel_spans` ADD `span_id` text;