CREATE TABLE `allowed_users` (
	`github_username` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `allowed` integer DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO `allowed_users` (`github_username`) VALUES
  ('brettimus'),
  ('mies'),
  ('flenter'),
  ('keturiosakys'),
  ('oscarvz'),
  ('Nleal'),
  ('mellowagain'),
  ('stephlow'),
  ('hatchan'),
  ('simonjeal');
