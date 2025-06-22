# Slack Integration Implementation

This document outlines the complete Slack integration for AsyncStatus, implemented using granular functions and Cloudflare Workflows.

## Overview

The Slack integration allows users to:
- Update their status using the `/asyncstatus` slash command
- Mention the bot to get help
- View team member status updates in Slack channels
- Process status updates through Cloudflare Workflows for reliability and scalability

## Architecture

### Function-Based Approach
Instead of using classes, the integration uses granular functions that work well with Cloudflare Workers:

- **Slack API Functions**: Direct interface with Slack Web API
- **Workflow Functions**: Orchestrate complex operations with error handling
- **Database Functions**: Handle member lookup and status persistence
- **Validation Functions**: Ensure security and data integrity

### Cloudflare Workflow Integration
Status updates are processed through Cloudflare Workflows, providing:
- **Reliability**: Automatic retries and error handling
- **Scalability**: Can handle high volume of status updates
- **Observability**: Built-in logging and monitoring
- **Durability**: Workflow state is persisted across steps

## Implementation Components

### 1. Core Files

- **`apps/api/src/lib/slack.ts`**: Granular Slack functions using Web API
- **`apps/api/src/workflows/slack/process-status-update.ts`**: Cloudflare Workflow for status processing
- **`apps/api/src/routers/slack.ts`**: HTTP endpoints for Slack events and commands
- **`apps/api/src/lib/env.ts`**: Environment variable definitions
- **`apps/api/src/index.ts`**: Configuration initialization

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

## Key Functions

### Slack API Functions (`apps/api/src/lib/slack.ts`)

```typescript
// Create Slack Web API client
createSlackClient(config: SlackConfig): WebClient

// Verify request signatures for security
verifySlackSignature(signingSecret, timestamp, body, signature): Promise<boolean>

// Parse slash command payloads
parseSlashCommand(body: string): SlackCommandPayload

// Get user information
getSlackUser(client: WebClient, userId: string): Promise<SlackUser | null>

// List workspace users
listSlackUsers(client: WebClient): Promise<SlackUser[]>

// Post messages to channels
postSlackMessage(client: WebClient, channel: string, text: string): Promise<{...}>

// Send ephemeral messages
postEphemeralMessage(client: WebClient, channel: string, user: string, text: string): Promise<{...}>
```

### Workflow Functions (`apps/api/src/workflows/slack/process-status-update.ts`)

```typescript
// Main workflow function
processStatusUpdate(params: ProcessStatusUpdateParams, db: Db): Promise<ProcessStatusUpdateResult>

// Helper functions
findMemberBySlackId(db: Db, slackUserId: string): Promise<Member | null>
saveStatusUpdate(db: Db, member: Member | null, statusUpdate: StatusUpdatePayload, organizationId: string): Promise<string | null>
postStatusToSlack(slackConfig: SlackConfig, statusUpdate: StatusUpdatePayload): Promise<{...}>
```

## Workflow Steps

When a user runs `/asyncstatus`, the following workflow executes:

1. **Request Validation**: Verify Slack signature and parse command
2. **Member Lookup**: Find corresponding AsyncStatus member by Slack ID
3. **Status Creation**: Create new status update in database (if member found)
4. **Slack Notification**: Post status message to Slack channel
5. **Error Handling**: Graceful fallback if any step fails

## API Endpoints

### POST `/slack/events`
Handles Slack Events API requests including:
- URL verification challenges
- App mention events
- Message events

**Security**: All requests verified with Slack signing secret

### POST `/slack/commands`
Handles slash command requests:
- `/asyncstatus [status message]` - Updates user status

**Process Flow**:
1. Verify request signature
2. Parse command payload
3. Trigger workflow for status processing
4. Return immediate acknowledgment to Slack

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

1. **Direct Function Usage**:
   ```typescript
   import { createSlackClient, postSlackMessage } from "./lib/slack";
   
   const client = createSlackClient(slackConfig);
   await postSlackMessage(client, "#general", "Hello team!");
   ```

2. **Workflow Usage**:
   ```typescript
   import { processStatusUpdate } from "./workflows/slack/process-status-update";
   
   const result = await processStatusUpdate({
     statusUpdate: { userId, status, channelId, teamId },
     slackConfig,
     organizationId
   }, db);
   ```

## Features Implemented

✅ **Granular Functions**: Modular, testable Slack operations
✅ **Cloudflare Workflows**: Reliable status processing with retries
✅ **Signature Verification**: Security through Slack request validation
✅ **Slash Commands**: `/asyncstatus` command working
✅ **Event Handling**: App mentions and message events
✅ **User Management**: List and filter Slack users
✅ **Error Handling**: Graceful fallback mechanisms
✅ **Database Integration**: Status persistence with member lookup
✅ **HTTP Endpoints**: Proper Slack API endpoints

## Benefits of Function-Based Approach

### 🚀 **Performance**
- Smaller bundle size (no class overhead)
- Better tree-shaking in Cloudflare Workers
- Faster cold starts

### 🔧 **Maintainability**
- Functions are easier to test individually
- Clear separation of concerns
- Easier to debug and modify

### 📈 **Scalability**
- Works seamlessly with Cloudflare Workflows
- Can be distributed across multiple workers
- Better resource utilization

### 🛡️ **Reliability**
- Workflow steps can be retried independently
- Better error isolation
- Durable execution across failures

## Next Steps / Enhancements

- [ ] **Advanced Member Mapping**: Link Slack users to AsyncStatus members via email
- [ ] **Interactive Components**: Add buttons and shortcuts
- [ ] **Scheduled Messages**: Regular status reminders via workflows
- [ ] **Rich Formatting**: Enhanced message formatting with blocks
- [ ] **Team Channels**: Automatic team-specific status updates
- [ ] **Analytics**: Track usage patterns and workflow success rates

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
- **Missing credentials**: Graceful degradation with clear logging
- **Slack API errors**: Proper error responses to users
- **Database errors**: Fallback to Slack-only mode
- **Workflow failures**: Automatic retries with exponential backoff
- **Invalid signatures**: Security protection against malicious requests

## Security

- **Request Verification**: All Slack requests verified with signing secret
- **Environment Variables**: Sensitive data stored securely
- **Error Messages**: No sensitive information exposed to users
- **Rate Limiting**: Built-in protection against abuse