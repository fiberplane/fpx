CREATE TABLE `groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `groups_app_routes` (
	`group_id` integer NOT NULL,
	`app_route_id` integer NOT NULL,
	PRIMARY KEY(`app_route_id`, `group_id`),
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_route_id`) REFERENCES `app_routes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_name_unique` ON `groups` (`name`);