PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`api_key_id` text NOT NULL,
	`prompt` text NOT NULL,
	`workflow_json` text,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_prompts`("id", "api_key_id", "prompt", "workflow_json", "error_message", "created_at", "updated_at") SELECT "id", "api_key_id", "prompt", "workflow_json", "error_message", "created_at", "updated_at" FROM `prompts`;--> statement-breakpoint
DROP TABLE `prompts`;--> statement-breakpoint
ALTER TABLE `__new_prompts` RENAME TO `prompts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;