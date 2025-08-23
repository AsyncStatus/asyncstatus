DROP INDEX "user_account_id_index";--> statement-breakpoint
DROP INDEX "discord_channel_channel_id_unique";--> statement-breakpoint
DROP INDEX "discord_channel_server_id_index";--> statement-breakpoint
DROP INDEX "discord_channel_channel_id_index";--> statement-breakpoint
DROP INDEX "discord_channel_guild_id_index";--> statement-breakpoint
DROP INDEX "discord_channel_type_index";--> statement-breakpoint
DROP INDEX "discord_event_discord_event_id_unique";--> statement-breakpoint
DROP INDEX "discord_event_server_id_idx";--> statement-breakpoint
DROP INDEX "discord_event_channel_id_idx";--> statement-breakpoint
DROP INDEX "discord_event_created_at_idx";--> statement-breakpoint
DROP INDEX "discord_event_discord_event_id_idx";--> statement-breakpoint
DROP INDEX "discord_event_discord_user_id_idx";--> statement-breakpoint
DROP INDEX "discord_event_type_idx";--> statement-breakpoint
DROP INDEX "discord_event_message_id_idx";--> statement-breakpoint
DROP INDEX "discord_event_vector_event_id_idx";--> statement-breakpoint
DROP INDEX "discord_integration_guild_id_unique";--> statement-breakpoint
DROP INDEX "discord_organization_id_index";--> statement-breakpoint
DROP INDEX "discord_sync_id_index";--> statement-breakpoint
DROP INDEX "discord_delete_id_index";--> statement-breakpoint
DROP INDEX "discord_guild_id_index";--> statement-breakpoint
DROP INDEX "discord_gateway_do_id_index";--> statement-breakpoint
DROP INDEX "discord_server_guild_id_unique";--> statement-breakpoint
DROP INDEX "discord_server_integration_id_index";--> statement-breakpoint
DROP INDEX "discord_server_guild_id_index";--> statement-breakpoint
DROP INDEX "discord_user_discord_user_id_unique";--> statement-breakpoint
DROP INDEX "discord_user_integration_id_index";--> statement-breakpoint
DROP INDEX "discord_user_discord_user_id_index";--> statement-breakpoint
DROP INDEX "discord_user_username_index";--> statement-breakpoint
DROP INDEX "github_event_github_id_unique";--> statement-breakpoint
DROP INDEX "github_event_repository_id_idx";--> statement-breakpoint
DROP INDEX "github_event_created_at_idx";--> statement-breakpoint
DROP INDEX "github_event_github_id_idx";--> statement-breakpoint
DROP INDEX "github_event_github_actor_id_idx";--> statement-breakpoint
DROP INDEX "github_event_type_idx";--> statement-breakpoint
DROP INDEX "github_event_vector_event_id_idx";--> statement-breakpoint
DROP INDEX "github_organization_id_index";--> statement-breakpoint
DROP INDEX "github_sync_id_index";--> statement-breakpoint
DROP INDEX "github_installation_id_index";--> statement-breakpoint
DROP INDEX "github_repository_repo_id_unique";--> statement-breakpoint
DROP INDEX "github_repo_integration_id_index";--> statement-breakpoint
DROP INDEX "github_repo_repo_id_index";--> statement-breakpoint
DROP INDEX "github_user_github_id_unique";--> statement-breakpoint
DROP INDEX "github_user_integration_id_index";--> statement-breakpoint
DROP INDEX "github_user_github_id_index";--> statement-breakpoint
DROP INDEX "gitlab_event_gitlab_id_unique";--> statement-breakpoint
DROP INDEX "gitlab_event_project_id_idx";--> statement-breakpoint
DROP INDEX "gitlab_event_created_at_idx";--> statement-breakpoint
DROP INDEX "gitlab_event_gitlab_id_idx";--> statement-breakpoint
DROP INDEX "gitlab_event_gitlab_actor_id_idx";--> statement-breakpoint
DROP INDEX "gitlab_event_type_idx";--> statement-breakpoint
DROP INDEX "gitlab_event_vector_event_id_idx";--> statement-breakpoint
DROP INDEX "gitlab_organization_id_index";--> statement-breakpoint
DROP INDEX "gitlab_sync_id_index";--> statement-breakpoint
DROP INDEX "gitlab_instance_url_index";--> statement-breakpoint
DROP INDEX "gitlab_project_project_id_unique";--> statement-breakpoint
DROP INDEX "gitlab_project_integration_id_index";--> statement-breakpoint
DROP INDEX "gitlab_project_project_id_index";--> statement-breakpoint
DROP INDEX "gitlab_user_gitlab_id_unique";--> statement-breakpoint
DROP INDEX "gitlab_user_integration_id_index";--> statement-breakpoint
DROP INDEX "gitlab_user_gitlab_id_index";--> statement-breakpoint
DROP INDEX "organization_invitation_id_index";--> statement-breakpoint
DROP INDEX "inviter_invitation_id_index";--> statement-breakpoint
DROP INDEX "organization_member_id_index";--> statement-breakpoint
DROP INDEX "user_member_id_index";--> statement-breakpoint
DROP INDEX "member_github_id_index";--> statement-breakpoint
DROP INDEX "member_gitlab_id_index";--> statement-breakpoint
DROP INDEX "member_slack_id_index";--> statement-breakpoint
DROP INDEX "member_discord_id_index";--> statement-breakpoint
DROP INDEX "organization_slug_unique";--> statement-breakpoint
DROP INDEX "slug_index";--> statement-breakpoint
DROP INDEX "schedule_organization_id_index";--> statement-breakpoint
DROP INDEX "schedule_created_by_member_id_index";--> statement-breakpoint
DROP INDEX "schedule_active_index";--> statement-breakpoint
DROP INDEX "schedule_name_index";--> statement-breakpoint
DROP INDEX "schedule_run_schedule_id_index";--> statement-breakpoint
DROP INDEX "schedule_run_status_index";--> statement-breakpoint
DROP INDEX "schedule_run_next_execution_index";--> statement-breakpoint
DROP INDEX "schedule_run_task_schedule_run_id";--> statement-breakpoint
DROP INDEX "schedule_run_task_status";--> statement-breakpoint
DROP INDEX "slack_channel_channel_id_unique";--> statement-breakpoint
DROP INDEX "slack_channel_integration_id_index";--> statement-breakpoint
DROP INDEX "slack_channel_channel_id_index";--> statement-breakpoint
DROP INDEX "slack_channel_name_index";--> statement-breakpoint
DROP INDEX "slack_event_slack_event_id_unique";--> statement-breakpoint
DROP INDEX "slack_event_channel_id_idx";--> statement-breakpoint
DROP INDEX "slack_event_created_at_idx";--> statement-breakpoint
DROP INDEX "slack_event_slack_event_id_idx";--> statement-breakpoint
DROP INDEX "slack_event_slack_user_id_idx";--> statement-breakpoint
DROP INDEX "slack_event_type_idx";--> statement-breakpoint
DROP INDEX "slack_event_message_ts_idx";--> statement-breakpoint
DROP INDEX "slack_event_slack_team_id_idx";--> statement-breakpoint
DROP INDEX "slack_event_vector_event_id_idx";--> statement-breakpoint
DROP INDEX "slack_integration_team_id_unique";--> statement-breakpoint
DROP INDEX "slack_organization_id_index";--> statement-breakpoint
DROP INDEX "slack_sync_id_index";--> statement-breakpoint
DROP INDEX "slack_delete_id_index";--> statement-breakpoint
DROP INDEX "slack_user_slack_user_id_unique";--> statement-breakpoint
DROP INDEX "slack_user_integration_id_index";--> statement-breakpoint
DROP INDEX "slack_user_slack_user_id_index";--> statement-breakpoint
DROP INDEX "status_job_member_idx";--> statement-breakpoint
DROP INDEX "status_job_state_idx";--> statement-breakpoint
DROP INDEX "status_update_slug_unique";--> statement-breakpoint
DROP INDEX "status_update_member_id_index";--> statement-breakpoint
DROP INDEX "status_update_organization_id_index";--> statement-breakpoint
DROP INDEX "status_update_team_id_index";--> statement-breakpoint
DROP INDEX "status_update_created_at_index";--> statement-breakpoint
DROP INDEX "status_update_effective_from_index";--> statement-breakpoint
DROP INDEX "status_update_effective_to_index";--> statement-breakpoint
DROP INDEX "status_update_is_draft_index";--> statement-breakpoint
DROP INDEX "status_update_item_update_id_index";--> statement-breakpoint
DROP INDEX "status_update_item_blocker_index";--> statement-breakpoint
DROP INDEX "summary_slug_unique";--> statement-breakpoint
DROP INDEX "summary_org_idx";--> statement-breakpoint
DROP INDEX "summary_team_idx";--> statement-breakpoint
DROP INDEX "summary_user_idx";--> statement-breakpoint
DROP INDEX "summary_type_idx";--> statement-breakpoint
DROP INDEX "summary_range_idx";--> statement-breakpoint
DROP INDEX "team_members_team_id_index";--> statement-breakpoint
DROP INDEX "team_members_member_id_index";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "email_user_index";--> statement-breakpoint
DROP INDEX "user_timezone_history_user_id_index";--> statement-breakpoint
DROP INDEX "user_timezone_history_created_at_index";--> statement-breakpoint
DROP INDEX "identifier_verification_index";--> statement-breakpoint
ALTER TABLE `gitlab_event_vector` ALTER COLUMN "embedding" TO "embedding" F32_BLOB(1024) NOT NULL;--> statement-breakpoint
CREATE INDEX `user_account_id_index` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `discord_channel_channel_id_unique` ON `discord_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_server_id_index` ON `discord_channel` (`server_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_channel_id_index` ON `discord_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_guild_id_index` ON `discord_channel` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_type_index` ON `discord_channel` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `discord_event_discord_event_id_unique` ON `discord_event` (`discord_event_id`);--> statement-breakpoint
CREATE INDEX `discord_event_server_id_idx` ON `discord_event` (`server_id`);--> statement-breakpoint
CREATE INDEX `discord_event_channel_id_idx` ON `discord_event` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_event_created_at_idx` ON `discord_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `discord_event_discord_event_id_idx` ON `discord_event` (`discord_event_id`);--> statement-breakpoint
CREATE INDEX `discord_event_discord_user_id_idx` ON `discord_event` (`discord_user_id`);--> statement-breakpoint
CREATE INDEX `discord_event_type_idx` ON `discord_event` (`type`);--> statement-breakpoint
CREATE INDEX `discord_event_message_id_idx` ON `discord_event` (`message_id`);--> statement-breakpoint
CREATE INDEX `discord_event_vector_event_id_idx` ON `discord_event_vector` (`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `discord_integration_guild_id_unique` ON `discord_integration` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_organization_id_index` ON `discord_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `discord_sync_id_index` ON `discord_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `discord_delete_id_index` ON `discord_integration` (`delete_id`);--> statement-breakpoint
CREATE INDEX `discord_guild_id_index` ON `discord_integration` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_gateway_do_id_index` ON `discord_integration` (`gateway_durable_object_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `discord_server_guild_id_unique` ON `discord_server` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_server_integration_id_index` ON `discord_server` (`integration_id`);--> statement-breakpoint
CREATE INDEX `discord_server_guild_id_index` ON `discord_server` (`guild_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `discord_user_discord_user_id_unique` ON `discord_user` (`discord_user_id`);--> statement-breakpoint
CREATE INDEX `discord_user_integration_id_index` ON `discord_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `discord_user_discord_user_id_index` ON `discord_user` (`discord_user_id`);--> statement-breakpoint
CREATE INDEX `discord_user_username_index` ON `discord_user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_event_github_id_unique` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_event_repository_id_idx` ON `github_event` (`repository_id`);--> statement-breakpoint
CREATE INDEX `github_event_created_at_idx` ON `github_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `github_event_github_id_idx` ON `github_event` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_event_github_actor_id_idx` ON `github_event` (`github_actor_id`);--> statement-breakpoint
CREATE INDEX `github_event_type_idx` ON `github_event` (`type`);--> statement-breakpoint
CREATE INDEX `github_event_vector_event_id_idx` ON `github_event_vector` (`event_id`);--> statement-breakpoint
CREATE INDEX `github_organization_id_index` ON `github_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `github_sync_id_index` ON `github_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `github_installation_id_index` ON `github_integration` (`installation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_repo_id_unique` ON `github_repository` (`repo_id`);--> statement-breakpoint
CREATE INDEX `github_repo_integration_id_index` ON `github_repository` (`integration_id`);--> statement-breakpoint
CREATE INDEX `github_repo_repo_id_index` ON `github_repository` (`repo_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_user_github_id_unique` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE INDEX `github_user_integration_id_index` ON `github_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `github_user_github_id_index` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_event_gitlab_id_unique` ON `gitlab_event` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_project_id_idx` ON `gitlab_event` (`project_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_created_at_idx` ON `gitlab_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `gitlab_event_gitlab_id_idx` ON `gitlab_event` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_gitlab_actor_id_idx` ON `gitlab_event` (`gitlab_actor_id`);--> statement-breakpoint
CREATE INDEX `gitlab_event_type_idx` ON `gitlab_event` (`type`);--> statement-breakpoint
CREATE INDEX `gitlab_event_vector_event_id_idx` ON `gitlab_event_vector` (`event_id`);--> statement-breakpoint
CREATE INDEX `gitlab_organization_id_index` ON `gitlab_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `gitlab_sync_id_index` ON `gitlab_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `gitlab_instance_url_index` ON `gitlab_integration` (`gitlab_instance_url`);--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_project_project_id_unique` ON `gitlab_project` (`project_id`);--> statement-breakpoint
CREATE INDEX `gitlab_project_integration_id_index` ON `gitlab_project` (`integration_id`);--> statement-breakpoint
CREATE INDEX `gitlab_project_project_id_index` ON `gitlab_project` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_user_gitlab_id_unique` ON `gitlab_user` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `gitlab_user_integration_id_index` ON `gitlab_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `gitlab_user_gitlab_id_index` ON `gitlab_user` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `organization_invitation_id_index` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `inviter_invitation_id_index` ON `invitation` (`inviter_id`);--> statement-breakpoint
CREATE INDEX `organization_member_id_index` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `user_member_id_index` ON `member` (`user_id`);--> statement-breakpoint
CREATE INDEX `member_github_id_index` ON `member` (`github_id`);--> statement-breakpoint
CREATE INDEX `member_gitlab_id_index` ON `member` (`gitlab_id`);--> statement-breakpoint
CREATE INDEX `member_slack_id_index` ON `member` (`slack_id`);--> statement-breakpoint
CREATE INDEX `member_discord_id_index` ON `member` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `slug_index` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `schedule_organization_id_index` ON `schedule` (`organization_id`);--> statement-breakpoint
CREATE INDEX `schedule_created_by_member_id_index` ON `schedule` (`created_by_member_id`);--> statement-breakpoint
CREATE INDEX `schedule_active_index` ON `schedule` (`is_active`);--> statement-breakpoint
CREATE INDEX `schedule_name_index` ON `schedule` (`name`);--> statement-breakpoint
CREATE INDEX `schedule_run_schedule_id_index` ON `schedule_run` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `schedule_run_status_index` ON `schedule_run` (`status`);--> statement-breakpoint
CREATE INDEX `schedule_run_next_execution_index` ON `schedule_run` (`next_execution_at`);--> statement-breakpoint
CREATE INDEX `schedule_run_task_schedule_run_id` ON `schedule_run_task` (`schedule_run_id`);--> statement-breakpoint
CREATE INDEX `schedule_run_task_status` ON `schedule_run_task` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `slack_channel_channel_id_unique` ON `slack_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `slack_channel_integration_id_index` ON `slack_channel` (`integration_id`);--> statement-breakpoint
CREATE INDEX `slack_channel_channel_id_index` ON `slack_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `slack_channel_name_index` ON `slack_channel` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `slack_event_slack_event_id_unique` ON `slack_event` (`slack_event_id`);--> statement-breakpoint
CREATE INDEX `slack_event_channel_id_idx` ON `slack_event` (`channel_id`);--> statement-breakpoint
CREATE INDEX `slack_event_created_at_idx` ON `slack_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `slack_event_slack_event_id_idx` ON `slack_event` (`slack_event_id`);--> statement-breakpoint
CREATE INDEX `slack_event_slack_user_id_idx` ON `slack_event` (`slack_user_id`);--> statement-breakpoint
CREATE INDEX `slack_event_type_idx` ON `slack_event` (`type`);--> statement-breakpoint
CREATE INDEX `slack_event_message_ts_idx` ON `slack_event` (`message_ts`);--> statement-breakpoint
CREATE INDEX `slack_event_slack_team_id_idx` ON `slack_event` (`slack_team_id`);--> statement-breakpoint
CREATE INDEX `slack_event_vector_event_id_idx` ON `slack_event_vector` (`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `slack_integration_team_id_unique` ON `slack_integration` (`team_id`);--> statement-breakpoint
CREATE INDEX `slack_organization_id_index` ON `slack_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `slack_sync_id_index` ON `slack_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `slack_delete_id_index` ON `slack_integration` (`delete_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `slack_user_slack_user_id_unique` ON `slack_user` (`slack_user_id`);--> statement-breakpoint
CREATE INDEX `slack_user_integration_id_index` ON `slack_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `slack_user_slack_user_id_index` ON `slack_user` (`slack_user_id`);--> statement-breakpoint
CREATE INDEX `status_job_member_idx` ON `status_generation_job` (`member_id`);--> statement-breakpoint
CREATE INDEX `status_job_state_idx` ON `status_generation_job` (`state`);--> statement-breakpoint
CREATE UNIQUE INDEX `status_update_slug_unique` ON `status_update` (`slug`) WHERE slug IS NOT NULL;--> statement-breakpoint
CREATE INDEX `status_update_member_id_index` ON `status_update` (`member_id`);--> statement-breakpoint
CREATE INDEX `status_update_organization_id_index` ON `status_update` (`organization_id`);--> statement-breakpoint
CREATE INDEX `status_update_team_id_index` ON `status_update` (`team_id`);--> statement-breakpoint
CREATE INDEX `status_update_created_at_index` ON `status_update` (`created_at`);--> statement-breakpoint
CREATE INDEX `status_update_effective_from_index` ON `status_update` (`effective_from`);--> statement-breakpoint
CREATE INDEX `status_update_effective_to_index` ON `status_update` (`effective_to`);--> statement-breakpoint
CREATE INDEX `status_update_is_draft_index` ON `status_update` (`is_draft`);--> statement-breakpoint
CREATE INDEX `status_update_item_update_id_index` ON `status_update_item` (`status_update_id`);--> statement-breakpoint
CREATE INDEX `status_update_item_blocker_index` ON `status_update_item` (`is_blocker`);--> statement-breakpoint
CREATE UNIQUE INDEX `summary_slug_unique` ON `summary` (`slug`) WHERE slug IS NOT NULL;--> statement-breakpoint
CREATE INDEX `summary_org_idx` ON `summary` (`organization_id`);--> statement-breakpoint
CREATE INDEX `summary_team_idx` ON `summary` (`team_id`);--> statement-breakpoint
CREATE INDEX `summary_user_idx` ON `summary` (`user_id`);--> statement-breakpoint
CREATE INDEX `summary_type_idx` ON `summary` (`type`);--> statement-breakpoint
CREATE INDEX `summary_range_idx` ON `summary` (`effective_from`,`effective_to`);--> statement-breakpoint
CREATE INDEX `team_members_team_id_index` ON `team_membership` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_members_member_id_index` ON `team_membership` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `email_user_index` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_timezone_history_user_id_index` ON `user_timezone_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_timezone_history_created_at_index` ON `user_timezone_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `identifier_verification_index` ON `verification` (`identifier`);