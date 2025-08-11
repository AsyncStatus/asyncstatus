CREATE TABLE `summary` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text,
	`organization_id` text NOT NULL,
	`team_id` text,
	`user_id` text,
	`type` text NOT NULL,
	`effective_from` integer NOT NULL,
	`effective_to` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`published_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `summary_slug_unique` ON `summary` (`slug`) WHERE slug IS NOT NULL;--> statement-breakpoint
CREATE INDEX `summary_org_idx` ON `summary` (`organization_id`);--> statement-breakpoint
CREATE INDEX `summary_team_idx` ON `summary` (`team_id`);--> statement-breakpoint
CREATE INDEX `summary_user_idx` ON `summary` (`user_id`);--> statement-breakpoint
CREATE INDEX `summary_type_idx` ON `summary` (`type`);--> statement-breakpoint
CREATE INDEX `summary_range_idx` ON `summary` (`effective_from`,`effective_to`);--> statement-breakpoint
ALTER TABLE `status_update` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `status_update` ADD `published_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `status_update_slug_unique` ON `status_update` (`slug`) WHERE slug IS NOT NULL;