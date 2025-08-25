CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_account_id_index` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `github_event` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`github_actor_id` text NOT NULL,
	`repository_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	`inserted_at` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `github_repository`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_event_github_id_unique` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_event_repository_id_idx` ON `github_event` (`repository_id`);--> statement-breakpoint
CREATE INDEX `github_event_created_at_idx` ON `github_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `github_event_github_id_idx` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_event_github_actor_id_idx` ON `github_event` (`github_actor_id`);--> statement-breakpoint
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
CREATE TABLE `github_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`installation_id` text NOT NULL,
	`access_token` text,
	`token_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sync_id` text,
	`sync_status_name` text,
	`sync_status_step` text,
	`sync_updated_at` integer,
	`sync_started_at` integer,
	`sync_finished_at` integer,
	`sync_error` text,
	`sync_error_at` integer,
	`delete_id` text,
	`delete_status` text,
	`delete_error` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `github_organization_id_index` ON `github_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `github_installation_id_index` ON `github_integration` (`installation_id`);--> statement-breakpoint
CREATE TABLE `github_repository` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`repo_id` text NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`full_name` text NOT NULL,
	`private` integer NOT NULL,
	`html_url` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `github_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_repo_id_unique` ON `github_repository` (`repo_id`);--> statement-breakpoint
CREATE INDEX `github_repo_integration_id_index` ON `github_repository` (`integration_id`);--> statement-breakpoint
CREATE INDEX `github_repo_repo_id_index` ON `github_repository` (`repo_id`);--> statement-breakpoint
CREATE TABLE `github_user` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`github_id` text NOT NULL,
	`login` text NOT NULL,
	`avatar_url` text,
	`html_url` text NOT NULL,
	`name` text,
	`email` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `github_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_user_github_id_unique` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_user_integration_id_index` ON `github_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `github_user_github_id_index` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`name` text,
	`team_id` text,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `organization_invitation_id_index` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `inviter_invitation_id_index` ON `invitation` (`inviter_id`);--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`slack_username` text,
	`github_id` text,
	`created_at` integer NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `organization_member_id_index` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `user_member_id_index` ON `member` (`user_id`);--> statement-breakpoint
CREATE INDEX `member_github_id_index` ON `member` (`github_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `slug_index` ON `organization` (`slug`);--> statement-breakpoint
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
CREATE TABLE `status_update` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`editor_json` text,
	`team_id` text,
	`effective_from` integer NOT NULL,
	`effective_to` integer NOT NULL,
	`mood` text,
	`emoji` text,
	`notes` text,
	`is_draft` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `status_update_member_id_index` ON `status_update` (`member_id`);--> statement-breakpoint
CREATE INDEX `status_update_organization_id_index` ON `status_update` (`organization_id`);--> statement-breakpoint
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
	`is_in_progress` integer DEFAULT false NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`status_update_id`) REFERENCES `status_update`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `status_update_item_update_id_index` ON `status_update_item` (`status_update_id`);--> statement-breakpoint
CREATE INDEX `status_update_item_blocker_index` ON `status_update_item` (`is_blocker`);--> statement-breakpoint
CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_membership` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`member_id` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_members_team_id_index` ON `team_membership` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_members_member_id_index` ON `team_membership` (`member_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `email_user_index` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `identifier_verification_index` ON `verification` (`identifier`);