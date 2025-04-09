ALTER TABLE `member` ADD `archived_at` integer;--> statement-breakpoint
ALTER TABLE `invitation` ALTER COLUMN "team_id" TO "team_id" text REFERENCES team(id) ON DELETE cascade ON UPDATE no action;