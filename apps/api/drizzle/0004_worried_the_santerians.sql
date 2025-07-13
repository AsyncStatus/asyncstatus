CREATE INDEX `github_sync_id_index` ON `github_integration` (`sync_id`);--> statement-breakpoint
ALTER TABLE `github_integration` DROP COLUMN `sync_status_name`;--> statement-breakpoint
ALTER TABLE `github_integration` DROP COLUMN `sync_status_step`;--> statement-breakpoint
ALTER TABLE `github_integration` DROP COLUMN `delete_status`;