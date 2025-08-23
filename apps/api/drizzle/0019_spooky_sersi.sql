ALTER TABLE `member` ADD `gitlab_id` text;--> statement-breakpoint
CREATE INDEX `member_gitlab_id_index` ON `member` (`gitlab_id`);