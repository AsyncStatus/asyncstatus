CREATE TABLE `linear_event` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`external_id` text NOT NULL,
	`type` text NOT NULL,
	`action` text,
	`issue_id` text,
	`issue_identifier` text,
	`project_id` text,
	`user_id` text,
	`team_id` text,
	`payload` text NOT NULL,
	`webhook_id` text,
	`webhook_timestamp` integer,
	`processed` integer DEFAULT false,
	`processed_at` integer,
	`summary` text,
	`summary_error` text,
	`summary_created_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `linear_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `linear_event_integration_id_index` ON `linear_event` (`integration_id`);--> statement-breakpoint
CREATE INDEX `linear_event_external_id_index` ON `linear_event` (`external_id`);--> statement-breakpoint
CREATE INDEX `linear_event_issue_id_index` ON `linear_event` (`issue_id`);--> statement-breakpoint
CREATE INDEX `linear_event_user_id_index` ON `linear_event` (`user_id`);--> statement-breakpoint
CREATE INDEX `linear_event_processed_index` ON `linear_event` (`processed`);--> statement-breakpoint
CREATE INDEX `linear_event_created_at_index` ON `linear_event` (`created_at`);--> statement-breakpoint
CREATE TABLE `linear_event_vector` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`embedding` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `linear_event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `linear_event_vector_event_id_index` ON `linear_event_vector` (`event_id`);--> statement-breakpoint
CREATE TABLE `linear_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`team_id` text NOT NULL,
	`team_name` text,
	`team_key` text,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`token_expires_at` integer,
	`user_id` text,
	`user_email` text,
	`scope` text,
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
CREATE UNIQUE INDEX `linear_integration_team_id_unique` ON `linear_integration` (`team_id`);--> statement-breakpoint
CREATE INDEX `linear_organization_id_index` ON `linear_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `linear_sync_id_index` ON `linear_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `linear_delete_id_index` ON `linear_integration` (`delete_id`);--> statement-breakpoint
CREATE TABLE `linear_issue` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`issue_id` text NOT NULL,
	`team_id` text,
	`project_id` text,
	`cycle_id` text,
	`parent_id` text,
	`number` integer NOT NULL,
	`identifier` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` integer,
	`priority_label` text,
	`estimate` real,
	`sort_order` real,
	`state` text,
	`state_type` text,
	`assignee_id` text,
	`creator_id` text,
	`label_ids` text,
	`subscriber_ids` text,
	`url` text,
	`branch_name` text,
	`customer_ticket_count` integer,
	`due_date` integer,
	`completed_at` integer,
	`archived_at` integer,
	`canceled_at` integer,
	`auto_closed_at` integer,
	`auto_archived_at` integer,
	`snoozed_until_at` integer,
	`started_at` integer,
	`triaged_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `linear_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `linear_issue_integration_id_index` ON `linear_issue` (`integration_id`);--> statement-breakpoint
CREATE INDEX `linear_issue_issue_id_index` ON `linear_issue` (`issue_id`);--> statement-breakpoint
CREATE INDEX `linear_issue_team_id_index` ON `linear_issue` (`team_id`);--> statement-breakpoint
CREATE INDEX `linear_issue_project_id_index` ON `linear_issue` (`project_id`);--> statement-breakpoint
CREATE INDEX `linear_issue_assignee_id_index` ON `linear_issue` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `linear_issue_identifier_index` ON `linear_issue` (`identifier`);--> statement-breakpoint
CREATE TABLE `linear_project` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`project_id` text NOT NULL,
	`team_id` text,
	`name` text NOT NULL,
	`key` text,
	`description` text,
	`state` text,
	`start_date` integer,
	`target_date` integer,
	`completed_at` integer,
	`archived_at` integer,
	`canceled_at` integer,
	`color` text,
	`icon` text,
	`progress` text,
	`issue_count` integer,
	`completed_issue_count` integer,
	`scope_change_count` integer,
	`completed_scope_change_count` integer,
	`slack_new_issue` integer,
	`slack_issue_comments` integer,
	`slack_issue_statuses` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `linear_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `linear_project_integration_id_index` ON `linear_project` (`integration_id`);--> statement-breakpoint
CREATE INDEX `linear_project_project_id_index` ON `linear_project` (`project_id`);--> statement-breakpoint
CREATE INDEX `linear_project_team_id_index` ON `linear_project` (`team_id`);--> statement-breakpoint
CREATE TABLE `linear_team` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`description` text,
	`private` integer,
	`icon` text,
	`color` text,
	`timezone` text,
	`issue_count` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `linear_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `linear_team_integration_id_index` ON `linear_team` (`integration_id`);--> statement-breakpoint
CREATE INDEX `linear_team_team_id_index` ON `linear_team` (`team_id`);--> statement-breakpoint
CREATE TABLE `linear_user` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text,
	`name` text,
	`display_name` text,
	`avatar_url` text,
	`admin` integer,
	`active` integer,
	`guest` integer,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `linear_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `linear_user_integration_id_index` ON `linear_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `linear_user_user_id_index` ON `linear_user` (`user_id`);--> statement-breakpoint
CREATE INDEX `linear_user_email_index` ON `linear_user` (`email`);