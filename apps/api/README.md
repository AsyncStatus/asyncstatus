# AsyncStatus API

This is the API for AsyncStatus.

## Getting Started

Install dependencies:

```bash
bun install
```

Set up environment variables in `.dev.vars`.

Run the development server:

```bash
bun run dev
```

## **Slack User Experience:**

From an end-user perspective, the workflow is:

1. 💬 User types `/asyncstatus Working on the Q2 report`
2. ✅ Bot acknowledges receipt of the command
3. 📣 Bot posts to the channel: `@username set their status: Working on the Q2 report`
4. 👀 Other team members can see what their colleague is working on

### 1. Create a New Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter a name for your app (e.g., "AsyncStatus Bot")
5. Select your workspace and click "Create App"

### 2. Configure Basic Information

1. In the "Basic Information" section, note your "Signing Secret" - you'll need this for the `SLACK_SIGNING_SECRET` environment variable
2. Under "App Credentials", note the various credentials

### 3. Configure Bot User

1. In the sidebar, navigate to "Features" → "Bot Users"
2. Click "Add a Bot User"
3. Set a display name and default username
4. Toggle "Always Show My Bot as Online" on if desired
5. Click "Save Changes"

### 4. Configure OAuth & Permissions

1. In the sidebar, go to "Features" → "OAuth & Permissions"
2. Under "Scopes", add the following Bot Token Scopes:
   - `chat:write` (Send messages as your app)
   - `commands` (Add slash commands)
   - `app_mentions:read` (View messages that mention your app)
   - `channels:history` (View messages in channels)
   - `groups:history` (View messages in private channels)
   - `im:history` (View messages in direct messages)
   - `mpim:history` (View messages in group direct messages)
3. Scroll up to "OAuth Tokens for Your Workspace"
4. Click "Install to Workspace" and authorize the app
5. After installation, note your "Bot User OAuth Token" - you'll need this for the `SLACK_BOT_TOKEN` environment variable

### 5. Configure Event Subscriptions

1. In the sidebar, go to "Features" → "Event Subscriptions"
2. Toggle "Enable Events" to On
3. Set the Request URL to: `https://[your-api-domain]/slack/events` (replace with your actual domain)
4. Under "Subscribe to bot events", add:
   - `message.channels` (When a message is posted in a channel)
   - `message.groups` (When a message is posted in a private channel)
   - `message.im` (When a message is posted in a DM)
   - `app_mention` (When your app is mentioned)
5. Click "Save Changes"

### 6. Configure Slash Commands

1. In the sidebar, go to "Features" → "Slash Commands"
2. Click "Create New Command"
3. Configure a new slash command:
   - Command: `/asyncstatus`
   - Request URL: `https://[your-api-domain]/slack/commands`
   - Short Description: "Update your status"
   - Usage Hint: "[your status message]"
4. Click "Save"

### 7. Configure Interactive Components (for Buttons and Shortcuts)

1. In the sidebar, go to "Features" → "Interactivity & Shortcuts"
2. Toggle "Interactivity" to On
3. Set the Request URL to: `https://[your-api-domain]/slack/events`
4. Under "Shortcuts", click "Create New Shortcut"
5. Choose "Message shortcut" and configure:
   - Name: "Save Message"
   - Short Description: "Save this message to your notes"
     x - Callback ID: `save_message`
6. Click "Create"
7. Click "Save Changes" at the bottom of the page

### 8. Update Your Environment Variables

Update your `.dev.vars` file with the tokens you noted:

```
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
SLACK_SIGNING_SECRET=your-actual-signing-secret
```

### 9. Reinstall Your App

If you make any changes to scopes after initial installation, you'll need to reinstall the app to your workspace:

1. Go to "OAuth & Permissions"
2. Click "Install to Workspace" again

## GitHub Integration

To enable GitHub integration, you need to create a GitHub App and configure it properly:

1. Go to your GitHub profile settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the following details:
   - GitHub App name: AsyncStatus (or your preferred name)
   - Homepage URL: Your application URL
   - Callback URL: `https://your-app-domain.com/callback/github`
   - Webhook: Disable for now (optional based on your needs)
   - Permissions:
     - Repository permissions:
       - Contents: Read-only
       - Metadata: Read-only
       - Pull requests: Read-only
       - Issues: Read-only
     - Organization permissions:
       - Members: Read-only
4. Generate a private key and note the App ID
5. Update your environment variables:
   ```
   GITHUB_APP_ID=your_app_id
   GITHUB_APP_PRIVATE_KEY=your_private_key
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

After installation, your GitHub integration will allow users to connect their GitHub organizations to AsyncStatus, providing access to repository data and team information.

## GitLab Integration

To enable GitLab integration, you need to create a GitLab OAuth application and configure it properly:

1. Go to your GitLab profile settings > Applications
2. Click "New application"
3. Fill in the following details:
   - Name: AsyncStatus (or your preferred name)
   - Redirect URI: `https://your-api-domain.com/integrations/gitlab/callback`
   - Scopes: `read_user read_repository read_api read_merge_request read_issue read_note read_pipeline`
4. Note the Application ID and Secret
5. Update your environment variables:
   ```
   GITLAB_CLIENT_ID=your_application_id
   GITLAB_CLIENT_SECRET=your_application_secret
   GITLAB_INSTANCE_URL=https://gitlab.com (or your GitLab instance URL)
   GITLAB_WEBHOOK_SECRET=your_webhook_secret
   ```

### Webhook Configuration

The GitLab integration automatically sets up webhooks for all projects when syncing. Webhooks are configured to send the following events:

- **Push events**: Code pushes, branch creation/deletion
- **Issue events**: Issue creation, updates, comments
- **Merge request events**: MR creation, updates, comments
- **Pipeline events**: CI/CD pipeline status changes
- **Job events**: Build job status changes
- **Deployment events**: Deployment status changes
- **Wiki events**: Wiki page changes
- **Release events**: Release creation/updates

### Webhook Security

Webhooks are secured using a shared secret token. The `GITLAB_WEBHOOK_SECRET` environment variable should be a strong, random string that matches what's configured in GitLab.

After installation, your GitLab integration will allow users to connect their GitLab organizations to AsyncStatus, providing access to repository data, team information, and real-time activity updates through webhooks.
