CREATE TABLE `gitlab_event` (
	`id` text PRIMARY KEY NOT NULL,
	`gitlab_id` text NOT NULL,
	`gitlab_actor_id` text NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`action` text,
	`payload` text,
	`created_at` integer NOT NULL,
	`inserted_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `gitlab_project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_event_gitlab_id_unique` ON `gitlab_event` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_project_id_idx` ON `gitlab_event` (`project_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_created_at_idx` ON `gitlab_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `gitlab_event_gitlab_id_idx` ON `gitlab_event` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_gitlab_actor_id_idx` ON `gitlab_event` (`gitlab_actor_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_type_idx` ON `gitlab_event` (`type`);--> statement-breakpoint
CREATE TABLE `gitlab_event_vector` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`embedding_text` text NOT NULL,
	`embedding` F32_BLOB(1024) NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `gitlab_event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gitlab_event_vector_event_id_idx` ON `gitlab_event_vector` (`event_id`);--> statement-breakpoint
CREATE TABLE `gitlab_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`gitlab_instance_url` text DEFAULT 'https://gitlab.com' NOT NULL,
	`group_id` text,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sync_id` text,
	`sync_updated_at` integer,
	`sync_started_at` integer,
	`sync_finished_at` integer,
	`sync_error` text,
	`sync_error_at` integer,
	`delete_id` text,
	`delete_error` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gitlab_organization_id_index` ON `gitlab_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `gitlab_sync_id_index` ON `gitlab_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `gitlab_instance_url_index` ON `gitlab_integration` (`gitlab_instance_url`);--> statement-breakpoint
CREATE TABLE `gitlab_project` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`namespace` text NOT NULL,
	`path_with_namespace` text NOT NULL,
	`visibility` text NOT NULL,
	`web_url` text NOT NULL,
	`description` text,
	`default_branch` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `gitlab_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_project_project_id_unique` ON `gitlab_project` (`project_id`);--> statement-breakpoint
CREATE INDEX `gitlab_project_integration_id_index` ON `gitlab_project` (`integration_id`);--> statement-breakpoint
CREATE INDEX `gitlab_project_project_id_index` ON `gitlab_project` (`project_id`);--> statement-breakpoint
CREATE TABLE `gitlab_user` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`gitlab_id` text NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`email` text,
	`avatar_url` text,
	`web_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `gitlab_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_user_gitlab_id_unique` ON `gitlab_user` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_user_integration_id_index` ON `gitlab_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `gitlab_user_gitlab_id_index` ON `gitlab_user` (`gitlab_id`);--> statement-breakpoint
ALTER TABLE `member` ADD `gitlab_id` text;--> statement-breakpoint
CREATE INDEX `member_gitlab_id_index` ON `member` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_vector_embedding_idx` ON `gitlab_event_vector`(libsql_vector_idx(embedding));