CREATE TABLE `changelog` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`repo_owner` text NOT NULL,
	`repo_name` text NOT NULL,
	`repo_full_name` text NOT NULL,
	`repo_url` text NOT NULL,
	`from_commit_sha` text,
	`to_commit_sha` text,
	`range_start` integer,
	`range_end` integer,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `changelog_slug_unique` ON `changelog` (`slug`);--> statement-breakpoint
CREATE INDEX `changelog_slug_idx` ON `changelog` (`slug`);--> statement-breakpoint
CREATE INDEX `changelog_repo_idx` ON `changelog` (`repo_owner`,`repo_name`);--> statement-breakpoint
CREATE INDEX `changelog_created_at_idx` ON `changelog` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `changelog_repo_commit_range_unique` ON `changelog` (`repo_owner`,`repo_name`,`from_commit_sha`,`to_commit_sha`) WHERE from_commit_sha IS NOT NULL AND to_commit_sha IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `changelog_repo_date_range_unique` ON `changelog` (`repo_owner`,`repo_name`,`range_start`,`range_end`) WHERE range_start IS NOT NULL AND range_end IS NOT NULL;--> statement-breakpoint
CREATE TABLE `changelog_generation_job` (
	`id` text PRIMARY KEY NOT NULL,
	`input_url` text NOT NULL,
	`repo_owner` text NOT NULL,
	`repo_name` text NOT NULL,
	`branch` text,
	`from_commit_sha` text,
	`to_commit_sha` text,
	`range_start` integer,
	`range_end` integer,
	`metadata` text,
	`state` text NOT NULL,
	`error_message` text,
	`error_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`changelog_id` text,
	FOREIGN KEY (`changelog_id`) REFERENCES `changelog`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `changelog_job_repo_idx` ON `changelog_generation_job` (`repo_owner`,`repo_name`);--> statement-breakpoint
CREATE INDEX `changelog_job_state_idx` ON `changelog_generation_job` (`state`);--> statement-breakpoint
CREATE INDEX `changelog_job_created_at_idx` ON `changelog_generation_job` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `changelog_job_repo_active_unique` ON `changelog_generation_job` (`repo_owner`,`repo_name`) WHERE state IN ('queued','running');--> statement-breakpoint
CREATE UNIQUE INDEX `changelog_job_repo_commit_active_unique` ON `changelog_generation_job` (`repo_owner`,`repo_name`,`from_commit_sha`,`to_commit_sha`) WHERE state IN ('queued','running') AND from_commit_sha IS NOT NULL AND to_commit_sha IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `changelog_job_repo_date_active_unique` ON `changelog_generation_job` (`repo_owner`,`repo_name`,`range_start`,`range_end`) WHERE state IN ('queued','running') AND range_start IS NOT NULL AND range_end IS NOT NULL;--> statement-breakpoint
CREATE TABLE `changelog_github_contributor` (
	`id` text PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`github_user_id` text,
	`name` text,
	`avatar_url` text,
	`html_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chg_github_contributor_login_unique` ON `changelog_github_contributor` (`login`);--> statement-breakpoint
CREATE UNIQUE INDEX `chg_github_contributor_user_id_unique` ON `changelog_github_contributor` (`github_user_id`);--> statement-breakpoint
CREATE TABLE `changelog_github_event` (
	`id` text PRIMARY KEY NOT NULL,
	`repo_owner` text NOT NULL,
	`repo_name` text NOT NULL,
	`source_type` text NOT NULL,
	`external_id` text NOT NULL,
	`source_url` text,
	`commit_sha` text,
	`pr_number` integer,
	`issue_number` integer,
	`release_tag` text,
	`payload` text,
	`event_timestamp_ms` integer,
	`inserted_at` integer NOT NULL,
	`last_seen_at` integer
);
--> statement-breakpoint
CREATE INDEX `chg_gh_event_repo_idx` ON `changelog_github_event` (`repo_owner`,`repo_name`);--> statement-breakpoint
CREATE INDEX `chg_gh_event_repo_ts_idx` ON `changelog_github_event` (`repo_owner`,`repo_name`,`event_timestamp_ms`);--> statement-breakpoint
CREATE INDEX `chg_gh_event_type_idx` ON `changelog_github_event` (`source_type`);--> statement-breakpoint
CREATE INDEX `chg_gh_event_commit_idx` ON `changelog_github_event` (`commit_sha`);--> statement-breakpoint
CREATE UNIQUE INDEX `chg_gh_event_unique` ON `changelog_github_event` (`repo_owner`,`repo_name`,`source_type`,`external_id`);--> statement-breakpoint
CREATE TABLE `changelog_github_repo_contributor` (
	`id` text PRIMARY KEY NOT NULL,
	`repo_owner` text NOT NULL,
	`repo_name` text NOT NULL,
	`contributor_login` text NOT NULL,
	`commit_count` integer DEFAULT 0 NOT NULL,
	`pr_count` integer DEFAULT 0 NOT NULL,
	`issue_count` integer DEFAULT 0 NOT NULL,
	`first_time_contributor` integer DEFAULT false NOT NULL,
	`first_seen_at` integer,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`contributor_login`) REFERENCES `changelog_github_contributor`(`login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chg_repo_contrib_repo_idx` ON `changelog_github_repo_contributor` (`repo_owner`,`repo_name`);--> statement-breakpoint
CREATE INDEX `chg_repo_contrib_last_seen_idx` ON `changelog_github_repo_contributor` (`repo_owner`,`repo_name`,`last_seen_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `chg_repo_contrib_unique` ON `changelog_github_repo_contributor` (`repo_owner`,`repo_name`,`contributor_login`);