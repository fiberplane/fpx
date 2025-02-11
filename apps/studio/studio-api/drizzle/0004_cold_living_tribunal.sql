ALTER TABLE `app_routes` RENAME TO `old_app_routes`;
--> statement-breakpoint
CREATE TABLE `app_routes` (
  `path` TEXT,
  `method` TEXT,
  `handler` TEXT,
  `handler_type` TEXT,
  `currentlyRegistered` INTEGER DEFAULT false,
  `route_origin` TEXT DEFAULT 'discovered',
  `openapi_spec` TEXT,
  `is_ws` INTEGER DEFAULT false,
  PRIMARY KEY(`method`, `path`, `handler_type`, `route_origin`)
);
--> statement-breakpoint
INSERT INTO `app_routes` (`path`, `method`, `handler`, `handler_type`, `currentlyRegistered`, `route_origin`, `openapi_spec`, `is_ws`)
SELECT `path`, `method`, `handler`, `handler_type`, `currentlyRegistered`, `route_origin`, `openapi_spec`, `is_ws`
FROM `old_app_routes`;
--> statement-breakpoint
DROP TABLE `old_app_routes`;