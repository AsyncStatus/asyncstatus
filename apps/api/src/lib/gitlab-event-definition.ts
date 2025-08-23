// GitLab webhook event types based on GitLab documentation
export type GitlabWebhookEventName = 
  | "push"
  | "issues"
  | "merge_request" 
  | "wiki_page"
  | "deployment"
  | "job"
  | "pipeline"
  | "tag_push"
  | "note"
  | "confidential_issues"
  | "confidential_note"
  | "release"
  | "subgroup"
  | "feature_flag"
  | "emoji"
  | "resource_access_token"
  | "member"
  | "push_rule"
  | "archive"
  | "system_hook";

// Base interface for all GitLab webhook events
export interface BaseGitlabWebhookEvent {
  object_kind: string;
  event_type?: string;
  user?: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
    email: string;
  };
  project?: {
    id: number;
    name: string;
    description: string;
    web_url: string;
    avatar_url: string | null;
    git_ssh_url: string;
    git_http_url: string;
    namespace: string;
    visibility_level: number;
    path_with_namespace: string;
    default_branch: string;
    homepage: string;
    url: string;
    ssh_url: string;
    http_url: string;
  };
  repository?: {
    name: string;
    url: string;
    description: string;
    homepage: string;
    git_http_url: string;
    git_ssh_url: string;
    visibility_level: number;
  };
}

// Push events
export interface GitlabPushEvent extends BaseGitlabWebhookEvent {
  object_kind: "push";
  event_name: "push";
  before: string;
  after: string;
  ref: string;
  checkout_sha: string;
  message: string | null;
  user_id: number;
  user_name: string;
  user_username: string;
  user_email: string;
  user_avatar: string;
  commits: Array<{
    id: string;
    message: string;
    title: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
  }>;
  total_commits_count: number;
}

// Merge Request events
export interface GitlabMergeRequestEvent extends BaseGitlabWebhookEvent {
  object_kind: "merge_request";
  event_type: "merge_request";
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
    email: string;
  };
  object_attributes: {
    id: number;
    iid: number;
    title: string;
    description: string;
    state: "opened" | "closed" | "locked" | "merged";
    created_at: string;
    updated_at: string;
    merge_status: string;
    target_branch: string;
    source_branch: string;
    source_project_id: number;
    target_project_id: number;
    author_id: number;
    assignee_id: number | null;
    url: string;
    source: {
      name: string;
      description: string;
      web_url: string;
      avatar_url: string | null;
      git_ssh_url: string;
      git_http_url: string;
      namespace: string;
      visibility_level: number;
      path_with_namespace: string;
      default_branch: string;
      homepage: string;
      url: string;
      ssh_url: string;
      http_url: string;
    };
    target: {
      name: string;
      description: string;
      web_url: string;
      avatar_url: string | null;
      git_ssh_url: string;
      git_http_url: string;
      namespace: string;
      visibility_level: number;
      path_with_namespace: string;
      default_branch: string;
      homepage: string;
      url: string;
      ssh_url: string;
      http_url: string;
    };
    last_commit: {
      id: string;
      message: string;
      timestamp: string;
      url: string;
      author: {
        name: string;
        email: string;
      };
    };
    work_in_progress: boolean;
    assignee: {
      id: number;
      name: string;
      username: string;
      avatar_url: string;
    } | null;
    action: "open" | "close" | "reopen" | "update" | "approved" | "unapproved" | "approval" | "unapproval" | "merge";
  };
  labels: Array<{
    id: number;
    title: string;
    color: string;
    project_id: number;
    created_at: string;
    updated_at: string;
    template: boolean;
    description: string;
    type: string;
    group_id: number;
  }>;
  changes: Record<string, { previous: unknown; current: unknown }>;
}

// Issue events
export interface GitlabIssueEvent extends BaseGitlabWebhookEvent {
  object_kind: "issue";
  event_type: "issue";
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
    email: string;
  };
  object_attributes: {
    id: number;
    iid: number;
    title: string;
    description: string;
    state: "opened" | "closed" | "reopened";
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    author_id: number;
    assignee_id: number | null;
    assignee_ids: number[];
    url: string;
    action: "open" | "close" | "reopen" | "update";
    severity: string;
    customer_relations_contacts: unknown[];
  };
  labels: Array<{
    id: number;
    title: string;
    color: string;
    project_id: number;
    created_at: string;
    updated_at: string;
    template: boolean;
    description: string;
    type: string;
    group_id: number;
  }>;
  changes: Record<string, { previous: unknown; current: unknown }>;
  assignees: Array<{
    id: number;
    name: string;
    username: string;
    avatar_url: string;
  }>;
}

// Pipeline events
export interface GitlabPipelineEvent extends BaseGitlabWebhookEvent {
  object_kind: "pipeline";
  object_attributes: {
    id: number;
    iid: number;
    ref: string;
    tag: boolean;
    sha: string;
    before_sha: string;
    source: string;
    status: "pending" | "running" | "success" | "failed" | "canceled" | "skipped" | "manual" | "scheduled";
    detailed_status: string;
    stages: string[];
    created_at: string;
    finished_at: string | null;
    duration: number | null;
    queued_duration: number | null;
    variables: Array<{
      key: string;
      value: string;
    }>;
    url: string;
  };
  merge_request?: {
    id: number;
    iid: number;
    title: string;
    source_branch: string;
    source_project_id: number;
    target_branch: string;
    target_project_id: number;
    state: string;
    merge_status: string;
    url: string;
  };
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
    email: string;
  };
  commit: {
    id: string;
    message: string;
    title: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
    };
  };
  builds: Array<{
    id: number;
    stage: string;
    name: string;
    status: string;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    duration: number | null;
    queued_duration: number | null;
    when: string;
    manual: boolean;
    allow_failure: boolean;
    user: {
      id: number;
      name: string;
      username: string;
      avatar_url: string;
      email: string;
    };
    runner: {
      id: number;
      description: string;
      ip_address: string;
      active: boolean;
      is_shared: boolean;
      name: string;
    } | null;
    artifacts_file: {
      filename: string | null;
      size: number | null;
    };
    environment: {
      name: string;
      action: string;
      deployment_tier: string;
    } | null;
  }>;
}

// Union type for all GitLab webhook events
export type AnyGitlabWebhookEventDefinition = 
  | GitlabPushEvent
  | GitlabMergeRequestEvent  
  | GitlabIssueEvent
  | GitlabPipelineEvent
  | (BaseGitlabWebhookEvent & { object_kind: GitlabWebhookEventName; [key: string]: unknown });
