CREATE TABLE `otel_spans_new` (
	`inner` text NOT NULL,
	`span_id` text NOT NULL,
	`trace_id` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `otel_spans_new` (`inner`, `span_id`, `trace_id`)
SELECT `parsed_payload`, `span_id`, `trace_id`
FROM `otel_spans`;
--> statement-breakpoint
DROP TABLE `otel_spans`;
--> statement-breakpoint
ALTER TABLE `otel_spans_new` RENAME TO `otel_spans`;
