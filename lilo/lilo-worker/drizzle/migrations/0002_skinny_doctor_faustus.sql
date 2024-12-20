ALTER TABLE `queries` RENAME TO `prompts`;--> statement-breakpoint
ALTER TABLE `prompts` RENAME COLUMN "query" TO "prompt";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`api_key_id` text NOT NULL,
	`prompt` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_prompts`("id", "api_key_id", "prompt", "createdAt", "updated_at") SELECT "id", "api_key_id", "prompt", "createdAt", "updated_at" FROM `prompts`;--> statement-breakpoint
DROP TABLE `prompts`;--> statement-breakpoint
ALTER TABLE `__new_prompts` RENAME TO `prompts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;