ALTER TABLE `member` ADD `linear_id` text;--> statement-breakpoint
CREATE INDEX `member_linear_id_index` ON `member` (`linear_id`);