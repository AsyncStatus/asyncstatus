CREATE TABLE `changelog_github_repository` (
	`id` text PRIMARY KEY NOT NULL,
	`repo_owner` text NOT NULL,
	`repo_name` text NOT NULL,
	`full_name` text,
	`html_url` text,
	`description` text,
	`default_branch` text,
	`homepage` text,
	`language` text,
	`license` text,
	`is_private` integer DEFAULT false NOT NULL,
	`is_fork` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`forks_count` integer DEFAULT 0 NOT NULL,
	`stargazers_count` integer DEFAULT 0 NOT NULL,
	`watchers_count` integer DEFAULT 0 NOT NULL,
	`open_issues_count` integer DEFAULT 0 NOT NULL,
	`pushed_at` integer,
	`first_seen_at` integer,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chg_gh_repo_owner_name_idx` ON `changelog_github_repository` (`repo_owner`,`repo_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `chg_gh_repo_owner_name_unique` ON `changelog_github_repository` (`repo_owner`,`repo_name`);