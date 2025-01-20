PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_workflow` (
	`workflow_id` text PRIMARY KEY NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`oai_schema_id` text NOT NULL,
	`steps` text NOT NULL,
	FOREIGN KEY (`oai_schema_id`) REFERENCES `oai_schema`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_workflow` (`workflow_id`, `summary`, `description`, `oai_schema_id`, `steps`) 
SELECT `id`, COALESCE(`summary`, ''), COALESCE(`description`, ''), COALESCE(`oai_schema_id`, ''), `steps` 
FROM `workflow`;
--> statement-breakpoint
DROP TABLE `workflow`;
--> statement-breakpoint
ALTER TABLE `__new_workflow` RENAME TO `workflow`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;