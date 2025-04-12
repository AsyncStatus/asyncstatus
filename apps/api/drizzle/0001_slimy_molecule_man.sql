CREATE TABLE `github_repository` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`repo_id` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`private` integer NOT NULL,
	`html_url` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `github_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
CREATE INDEX `github_user_integration_id_index` ON `github_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `github_user_github_id_index` ON `github_user` (`github_id`);