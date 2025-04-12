CREATE TABLE `github_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`installation_id` text NOT NULL,
	`access_token` text,
	`token_expires_at` integer,
	`repositories` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `github_organization_id_index` ON `github_integration` (`organization_id`);
CREATE INDEX `github_installation_id_index` ON `github_integration` (`installation_id`); 