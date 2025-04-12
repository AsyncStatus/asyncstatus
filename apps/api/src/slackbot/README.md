## Slack app manifest

Apply here: https://app.slack.com/app-settings/<app_id>/app-manifest

```json
{
    "display_information": {
        "name": "AsyncStatus",
        "description": "Standup meetings suck",
        "background_color": "#000000",
        "long_description": "Your team already pushed code, closed tickets, replied in threads, fixed small things no one asked them to. We turn it into an update. Or you can write it yourself. Either way, no one has to talk about it at 9:30 a.m."
    },
    "features": {
        "bot_user": {
            "display_name": "AsyncStatus",
            "always_online": true
        },
        "shortcuts": [
            {
                "name": "Save Message",
                "type": "message",
                "callback_id": "save_message",
                "description": "Save message to AsyncStatus"
            }
        ],
        "slash_commands": [
            {
                "command": "/asyncstatus",
                "url": "https://api.asyncstatus.com/slack/commands",
                "description": "Interact with AsyncStatus",
                "usage_hint": "[your status message]",
                "should_escape": false
            }
        ]
    },
    "oauth_config": {
        "redirect_urls": [
            "https://api.asyncstatus.com/slack/oauth"
        ],
        "scopes": {
            "bot": [
                "app_mentions:read",
                "channels:history",
                "chat:write",
                "commands",
                "im:history",
                "incoming-webhook",
                "groups:history",
                "mpim:history"
            ]
        }
    },
    "settings": {
        "event_subscriptions": {
            "request_url": "https://api.asyncstatus.com/slack/events",
            "bot_events": [
                "app_mention",
                "message.channels",
                "message.groups",
                "message.im"
            ]
        },
        "interactivity": {
            "is_enabled": true,
            "request_url": "https://api.asyncstatus.com/slack/events"
        },
        "org_deploy_enabled": false,
        "socket_mode_enabled": false,
        "token_rotation_enabled": false
    }
}
```
