CREATE TABLE `github_event` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`member_id` text NOT NULL,
	`type` text NOT NULL,
	`repo` text NOT NULL,
	`created_at` integer NOT NULL,
	`canonical_text` text,
	`payload` text,
	`inserted_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `github_event_member_id_idx` ON `github_event` (`member_id`);--> statement-breakpoint
CREATE INDEX `github_event_created_at_idx` ON `github_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `github_event_github_id_idx` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE TABLE `github_event_vector` (
	`event_id` text PRIMARY KEY NOT NULL,
	`embedding` F32_BLOB(1024) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `github_event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `status_generation_job` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`effective_from` integer NOT NULL,
	`effective_to` integer NOT NULL,
	`state` text NOT NULL,
	`error_message` text,
	`status_update_id` text,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`status_update_id`) REFERENCES `status_update`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `status_job_member_idx` ON `status_generation_job` (`member_id`);--> statement-breakpoint
CREATE INDEX `status_job_state_idx` ON `status_generation_job` (`state`);--> statement-breakpoint
ALTER TABLE `member` ADD `github_id` text;--> statement-breakpoint
CREATE INDEX `member_github_id_index` ON `member` (`github_id`);