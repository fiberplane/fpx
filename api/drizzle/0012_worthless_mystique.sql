CREATE TABLE `otel_spans_new` (
	`inner` text NOT NULL,
	`span_id` text NOT NULL,
	`trace_id` text NOT NULL
);

INSERT INTO `otel_spans_new` (`inner`, `span_id`, `trace_id`)
SELECT `inner`, `span_id`, `trace_id`
FROM `otel_spans`;

DROP TABLE `otel_spans`;

ALTER TABLE `otel_spans_new` RENAME TO `otel_spans`;
