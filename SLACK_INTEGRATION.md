# Slack Integration Implementation

This document outlines the complete Slack integration for AsyncStatus, implemented using the Slack Bolt framework.

## Overview

The Slack integration allows users to:
- Update their status using the `/asyncstatus` slash command
- Mention the bot to get help
- View team member status updates in Slack channels

## Implementation Components

### 1. Core Files

- **`apps/api/src/lib/slack-bot.ts`**: Main Slack bot service using Bolt framework
- **`apps/api/src/routers/slack.ts`**: HTTP endpoints for Slack events and commands
- **`apps/api/src/lib/env.ts`**: Environment variable definitions
- **`apps/api/src/index.ts`**: Bot initialization in main API

### 2. Environment Variables

Required environment variables in `.dev.vars`:

```bash
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

### 3. Database Schema

The integration uses the existing `member` table with the `slackUsername` field:

```sql
ALTER TABLE `member` ADD `slack_username` text;
```

## Slack App Configuration

### Bot Token Scopes
- `chat:write` - Send messages as your app
- `commands` - Add slash commands
- `app_mentions:read` - View messages that mention your app
- `channels:history` - View messages in channels
- `groups:history` - View messages in private channels
- `im:history` - View messages in direct messages
- `mpim:history` - View messages in group direct messages

### Event Subscriptions
- `message.channels` - When a message is posted in a channel
- `message.groups` - When a message is posted in a private channel
- `message.im` - When a message is posted in a DM
- `app_mention` - When your app is mentioned

### Slash Commands
- Command: `/asyncstatus`
- Request URL: `https://[your-api-domain]/slack/commands`
- Short Description: "Update your status"
- Usage Hint: "[your status message]"

### Request URLs
- Events: `https://[your-api-domain]/slack/events`
- Commands: `https://[your-api-domain]/slack/commands`
- Interactivity: `https://[your-api-domain]/slack/events`

## API Endpoints

### POST `/slack/events`
Handles Slack Events API requests including:
- URL verification challenges
- App mention events
- Message events

### POST `/slack/commands`
Handles slash command requests:
- `/asyncstatus [status message]` - Updates user status

## Usage

### For End Users

1. **Update Status**:
   ```
   /asyncstatus Working on the Q2 report
   ```

2. **Get Help**:
   ```
   @AsyncStatus help
   ```

### For Developers

1. **Initialize Slack Bot**:
   ```typescript
   const slackbot = createSlackBot(
     process.env.SLACK_BOT_TOKEN,
     process.env.SLACK_SIGNING_SECRET,
     db
   );
   ```

2. **Access in Routes**:
   ```typescript
   const slackbot = c.get("slackbot");
   if (slackbot) {
     await slackbot.postMessage(channel, message);
   }
   ```

## Features Implemented

✅ **Slash Commands**: `/asyncstatus` command working
✅ **Event Handling**: App mentions and message events
✅ **User Management**: List and filter Slack users
✅ **Error Handling**: Graceful error responses
✅ **Database Integration**: Ready for status storage
✅ **HTTP Endpoints**: Proper Slack API endpoints

## Next Steps / Enhancements

- [ ] **Status Persistence**: Save status updates to database
- [ ] **User Mapping**: Link Slack users to AsyncStatus members
- [ ] **Interactive Components**: Add buttons and shortcuts
- [ ] **Scheduled Messages**: Regular status reminders
- [ ] **Rich Formatting**: Enhanced message formatting with blocks
- [ ] **Team Channels**: Automatic team-specific status updates

## Testing

To test the integration:

1. Set up your Slack app following the configuration above
2. Add the environment variables to `.dev.vars`
3. Start the API server: `bun run dev`
4. Use ngrok or similar to expose your local server
5. Update your Slack app's request URLs
6. Test the `/asyncstatus` command in your Slack workspace

## Error Handling

The integration includes comprehensive error handling:
- Missing credentials result in graceful degradation
- Slack API errors are logged and handled appropriately
- Users receive helpful error messages when commands fail
- The system continues to function even if Slack is unavailable

## Security

- Uses Slack's signing secret for request verification
- Bot token is stored securely in environment variables
- All API requests are validated before processing
- Error messages don't expose sensitive information