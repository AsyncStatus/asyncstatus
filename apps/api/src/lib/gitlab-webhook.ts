/**
 * GitLab Webhook Utilities
 * Functions for setting up and managing GitLab webhooks
 */

export interface GitlabWebhookConfig {
  accessToken: string;
  instanceUrl: string;
  projectId: string;
  webhookUrl: string;
  webhookSecret: string;
}

export interface GitlabWebhookResponse {
  id: number;
  url: string;
  project_id: number;
  push_events: boolean;
  push_events_branch_filter: string;
  issues_events: boolean;
  confidential_issues_events: boolean;
  merge_requests_events: boolean;
  tag_push_events: boolean;
  note_events: boolean;
  confidential_note_events: boolean;
  job_events: boolean;
  pipeline_events: boolean;
  wiki_page_events: boolean;
  deployment_events: boolean;
  releases_events: boolean;
  enable_ssl_verification: boolean;
  created_at: string;
}

/**
 * Set up a webhook for a GitLab project
 */
export async function setupGitlabProjectWebhook(config: GitlabWebhookConfig): Promise<GitlabWebhookResponse> {
  const { accessToken, instanceUrl, projectId, webhookUrl, webhookSecret } = config;
  
  const webhookData = {
    url: "https://hill-obtaining-signature-bachelor.trycloudflare.com/integrations/gitlab/webhooks",
    token: webhookSecret,
    push_events: true,
    push_events_branch_filter: '',
    issues_events: true,
    confidential_issues_events: true,
    merge_requests_events: true,
    tag_push_events: true,
    note_events: true,
    confidential_note_events: true,
    job_events: true,
    pipeline_events: true,
    wiki_page_events: true,
    deployment_events: true,
    releases_events: true,
    enable_ssl_verification: true,
  };

  const response = await fetch(`${instanceUrl}/api/v4/projects/${projectId}/hooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create GitLab webhook: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json() as GitlabWebhookResponse;
}

/**
 * List existing webhooks for a GitLab project
 */
export async function listGitlabProjectWebhooks(
  accessToken: string,
  instanceUrl: string,
  projectId: string
): Promise<GitlabWebhookResponse[]> {
  const response = await fetch(`${instanceUrl}/api/v4/projects/${projectId}/hooks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list GitLab webhooks: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json() as GitlabWebhookResponse[];
}

/**
 * Delete a webhook from a GitLab project
 */
export async function deleteGitlabProjectWebhook(
  accessToken: string,
  instanceUrl: string,
  projectId: string,
  webhookId: number
): Promise<void> {
  const response = await fetch(`${instanceUrl}/api/v4/projects/${projectId}/hooks/${webhookId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete GitLab webhook: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Update an existing webhook for a GitLab project
 */
export async function updateGitlabProjectWebhook(
  accessToken: string,
  instanceUrl: string,
  projectId: string,
  webhookId: number,
  webhookData: Partial<Omit<GitlabWebhookConfig, 'accessToken' | 'instanceUrl' | 'projectId'>>
): Promise<GitlabWebhookResponse> {
  const response = await fetch(`${instanceUrl}/api/v4/projects/${projectId}/hooks/${webhookId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update GitLab webhook: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json() as GitlabWebhookResponse;
}

/**
 * Check if a webhook exists for a specific URL
 */
export async function findWebhookByUrl(
  accessToken: string,
  instanceUrl: string,
  projectId: string,
  targetUrl: string
): Promise<GitlabWebhookResponse | null> {
  const webhooks = await listGitlabProjectWebhooks(accessToken, instanceUrl, projectId);
  return webhooks.find(webhook => webhook.url === targetUrl) || null;
}

/**
 * Test GitLab API connection and permissions
 */
export async function testGitlabApiConnection(
  accessToken: string,
  instanceUrl: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Test user authentication
    const userResponse = await fetch(`${instanceUrl}/api/v4/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return {
        success: false,
        error: `Failed to authenticate with GitLab API: ${userResponse.status} ${userResponse.statusText} - ${errorText}`,
      };
    }

    const user = await userResponse.json();
    
    // Test projects access
    const projectsResponse = await fetch(`${instanceUrl}/api/v4/projects?membership=true&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      return {
        success: false,
        error: `Failed to access GitLab projects: ${projectsResponse.status} ${projectsResponse.statusText} - ${errorText}`,
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: `GitLab API connection test failed: ${error}`,
    };
  }
}

/**
 * Get detailed webhook setup information for debugging
 */
export async function getWebhookSetupInfo(
  accessToken: string,
  instanceUrl: string,
  projectId: string,
  webhookUrl: string
): Promise<{
  projectExists: boolean;
  projectAccess: boolean;
  existingWebhooks: GitlabWebhookResponse[];
  canCreateWebhook: boolean;
  error?: string;
}> {
  try {
    // Check if project exists and is accessible
    const projectResponse = await fetch(`${instanceUrl}/api/v4/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const projectExists = projectResponse.ok;
    const projectAccess = projectResponse.ok;

    if (!projectExists) {
      return {
        projectExists: false,
        projectAccess: false,
        existingWebhooks: [],
        canCreateWebhook: false,
        error: `Project ${projectId} not found or not accessible`,
      };
    }

    // Get existing webhooks
    let existingWebhooks: GitlabWebhookResponse[] = [];
    try {
      existingWebhooks = await listGitlabProjectWebhooks(accessToken, instanceUrl, projectId);
    } catch (error) {
      console.warn(`Failed to list webhooks for project ${projectId}:`, error);
    }

    // Check if we can create webhooks (test with a minimal request)
    const testResponse = await fetch(`${instanceUrl}/api/v4/projects/${projectId}/hooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const canCreateWebhook = testResponse.ok;

    return {
      projectExists: true,
      projectAccess: true,
      existingWebhooks,
      canCreateWebhook,
    };
  } catch (error) {
    return {
      projectExists: false,
      projectAccess: false,
      existingWebhooks: [],
      canCreateWebhook: false,
      error: `Failed to get webhook setup info: ${error}`,
    };
  }
}
