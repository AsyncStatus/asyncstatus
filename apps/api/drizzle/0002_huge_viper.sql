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
DROP TABLE `session`;--> statement-breakpoint
DROP INDEX "user_account_id_index";--> statement-breakpoint
DROP INDEX "organization_invitation_id_index";--> statement-breakpoint
DROP INDEX "inviter_invitation_id_index";--> statement-breakpoint
DROP INDEX "organization_member_id_index";--> statement-breakpoint
DROP INDEX "user_member_id_index";--> statement-breakpoint
DROP INDEX "organization_slug_unique";--> statement-breakpoint
DROP INDEX "slug_index";--> statement-breakpoint
DROP INDEX "team_members_team_id_index";--> statement-breakpoint
DROP INDEX "team_members_member_id_index";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "email_user_index";--> statement-breakpoint
DROP INDEX "identifier_verification_index";--> statement-breakpoint
ALTER TABLE `organization` ALTER COLUMN "slug" TO "slug" text NOT NULL;--> statement-breakpoint
CREATE INDEX `user_account_id_index` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `organization_invitation_id_index` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `inviter_invitation_id_index` ON `invitation` (`inviter_id`);--> statement-breakpoint
CREATE INDEX `organization_member_id_index` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `user_member_id_index` ON `member` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `slug_index` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `email_user_index` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `identifier_verification_index` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `member` DROP COLUMN `team_id`;