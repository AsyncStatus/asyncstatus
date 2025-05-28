CREATE TABLE `github_event` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`github_user_id` text NOT NULL,
	`repository_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	`inserted_at` integer NOT NULL,
	FOREIGN KEY (`github_user_id`) REFERENCES `github_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `github_repository`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_event_github_id_unique` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_event_repository_id_idx` ON `github_event` (`repository_id`);--> statement-breakpoint
CREATE INDEX `github_event_created_at_idx` ON `github_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `github_event_github_id_idx` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_event_type_idx` ON `github_event` (`type`);--> statement-breakpoint
CREATE TABLE `github_event_vector` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`embedding_text` text NOT NULL,
	`embedding` F32_BLOB(1024) NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `github_event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `github_event_vector_event_id_idx` ON `github_event_vector` (`event_id`);--> statement-breakpoint
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
ALTER TABLE `github_integration` ADD `sync_status_name` text;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `sync_status_step` text;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `sync_updated_at` integer;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `sync_started_at` integer;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `sync_finished_at` integer;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `sync_error` text;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `sync_error_at` integer;--> statement-breakpoint
ALTER TABLE `github_integration` ADD `delete_error` text;--> statement-breakpoint
ALTER TABLE `github_integration` DROP COLUMN `repositories`;--> statement-breakpoint
ALTER TABLE `github_integration` DROP COLUMN `sync_status`;--> statement-breakpoint
ALTER TABLE `github_repository` ADD `owner` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_repo_id_unique` ON `github_repository` (`repo_id`);--> statement-breakpoint
ALTER TABLE `member` ADD `github_id` text;--> statement-breakpoint
CREATE INDEX `member_github_id_index` ON `member` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_user_github_id_unique` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE INDEX embedding_idx ON `github_event_vector` (libsql_vector_idx(`embedding`));