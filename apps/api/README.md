# AsyncStatus API

AsyncStatus is a tool for managing and tracking the status of asynchronous tasks in your applications.

## Features

- Task management
- Status tracking
- Notifications
- Slack bot integration

## Getting Started

To get started with AsyncStatus API, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/your-repo/asyncstatus.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Slack Bot Integration

The AsyncStatus API includes Slack bot integration for sending notifications and handling interactions from Slack.

### Setup Instructions

1. **Create a Slack App**
   - Go to [Slack API Dashboard](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "AsyncStatus") and select a workspace for development

2. **Gather App Credentials**
   - From "Basic Information" page, note:
     - Client ID
     - Client Secret
     - Signing Secret
   - Add these to your `.dev.vars` file:
     ```
     SLACK_CLIENT_ID=your_client_id
     SLACK_CLIENT_SECRET=your_client_secret
     SLACK_SIGNING_SECRET=your_signing_secret
     ```

3. **Configure OAuth & Permissions**
   - Navigate to "OAuth & Permissions"
   - Add Redirect URL: `https://your-domain.com/slack/oauth`
   - Add Bot Token Scopes:
     - `commands` (for slash commands)
     - `chat:write` (for posting messages)
     - `incoming-webhook` (for receiving messages)

4. **Configure Event Subscriptions**
   - Navigate to "Event Subscriptions"
   - Enable Events and set Request URL: `https://your-domain.com/slack/events`
   - Subscribe to bot events:
     - `message.channels` (public channel messages)
     - `message.im` (direct messages)

5. **Set up Slash Commands**
   - Navigate to "Slash Commands"
   - Create command: `/asyncstatus`
   - Request URL: `https://your-domain.com/slack/commands`
   - Description: "Interact with AsyncStatus"
   - Usage hint: "help, status"

6. **Activate Interactivity** (Optional)
   - Navigate to "Interactivity & Shortcuts"
   - Enable and set Request URL: `https://your-domain.com/slack/events`

7. **Install to Workspace**
   - Go to "Install App"
   - Click "Install to Workspace" and authorize

### Testing the Integration

- **OAuth Flow**: Use the Connect Slack button in your organization settings
- **Commands**: Type `/asyncstatus help` in Slack
- **Events**: Mention the bot in a channel it's been invited to

### Development with Ngrok

When using ngrok for local development:
1. Start ngrok: `ngrok http 8787` (or your port)
2. Update all URLs in Slack app configuration with your ngrok URL
3. Remember that the URL changes when you restart ngrok

### Available Commands

- `/asyncstatus help` - Display help information
- `/asyncstatus status` - Check current status