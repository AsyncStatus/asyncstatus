CREATE TABLE `public_status_share` (
	`id` text PRIMARY KEY NOT NULL,
	`status_update_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`status_update_id`) REFERENCES `status_update`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_status_share_slug_unique` ON `public_status_share` (`slug`);--> statement-breakpoint
CREATE INDEX `public_share_status_update_id_index` ON `public_status_share` (`status_update_id`);--> statement-breakpoint
CREATE INDEX `public_share_organization_id_index` ON `public_status_share` (`organization_id`);--> statement-breakpoint
CREATE INDEX `public_share_slug_index` ON `public_status_share` (`slug`);--> statement-breakpoint
CREATE INDEX `public_share_is_active_index` ON `public_status_share` (`is_active`);--> statement-breakpoint
CREATE TABLE `status_update` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`team_id` text,
	`effective_from` integer NOT NULL,
	`effective_to` integer NOT NULL,
	`mood` text,
	`emoji` text,
	`is_draft` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `status_update_member_id_index` ON `status_update` (`member_id`);--> statement-breakpoint
CREATE INDEX `status_update_team_id_index` ON `status_update` (`team_id`);--> statement-breakpoint
CREATE INDEX `status_update_created_at_index` ON `status_update` (`created_at`);--> statement-breakpoint
CREATE INDEX `status_update_effective_from_index` ON `status_update` (`effective_from`);--> statement-breakpoint
CREATE INDEX `status_update_effective_to_index` ON `status_update` (`effective_to`);--> statement-breakpoint
CREATE INDEX `status_update_is_draft_index` ON `status_update` (`is_draft`);--> statement-breakpoint
CREATE TABLE `status_update_item` (
	`id` text PRIMARY KEY NOT NULL,
	`status_update_id` text NOT NULL,
	`content` text NOT NULL,
	`is_blocker` integer DEFAULT false NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`status_update_id`) REFERENCES `status_update`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `status_update_item_update_id_index` ON `status_update_item` (`status_update_id`);--> statement-breakpoint
CREATE INDEX `status_update_item_blocker_index` ON `status_update_item` (`is_blocker`);