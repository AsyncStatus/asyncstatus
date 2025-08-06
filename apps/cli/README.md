# ⧗ AsyncStatus CLI

CLI for async status updates.

## Features

- **Git-style interactive editing** - `asyncstatus edit` opens your `$EDITOR` like `git rebase -i`, supports mood and notes
- **Natural date parsing** - `asyncstatus edit yesterday`, `asyncstatus edit "3 days ago"`
- **Zero-config editor detection** - Respects your existing `$EDITOR`, `$VISUAL`, or git config
- **Fast terminal workflow** - Add status updates without leaving your shell
- **Proper authentication** - JWT tokens, respects `~/.asyncstatus/config.json`
- **Multiple environments** - Override API endpoint with `ASYNCSTATUS_API_URL`

## Installation

### Quick Install (Recommended)

Install the latest version using our installation script:

```bash
# Install to ~/.asyncstatus/cli (no sudo required)
curl -fsSL https://raw.githubusercontent.com/AsyncStatus/asyncstatus/main/apps/cli/install.sh | bash

# Add to your PATH (add this to your ~/.bashrc, ~/.zshrc, etc.)
echo 'export PATH="$HOME/.asyncstatus/cli:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Alternative installation locations:

```bash
# Install to system directory (requires sudo)
curl -fsSL https://raw.githubusercontent.com/AsyncStatus/asyncstatus/main/apps/cli/install.sh | sudo INSTALL_DIR="/usr/local/bin" bash

# Install to user's local bin
curl -fsSL https://raw.githubusercontent.com/AsyncStatus/asyncstatus/main/apps/cli/install.sh | INSTALL_DIR="$HOME/.local/bin" bash
```

### Manual Installation

Download the appropriate binary for your platform from the [latest release](https://github.com/AsyncStatus/asyncstatus/releases/latest):

- **Linux (x64)**: `asyncstatus-linux-amd64`
- **macOS (Intel)**: `asyncstatus-darwin-amd64` 
- **macOS (Apple Silicon)**: `asyncstatus-darwin-arm64`
- **Windows (x64)**: `asyncstatus-windows-amd64.exe`

Make it executable and move to your PATH:

```bash
# Create the directory and install
mkdir -p ~/.asyncstatus/cli
chmod +x asyncstatus-*
mv asyncstatus-* ~/.asyncstatus/cli/asyncstatus

# Add to PATH
echo 'export PATH="$HOME/.asyncstatus/cli:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Build from Source

```bash
make build
make install
```

## Usage

### Authentication

First, login to your AsyncStatus account:

```bash
# Login with email prompt
asyncstatus login

# Login with email flag (will still prompt for password securely)
asyncstatus login --email user@example.com

# Login to a specific environment
asyncstatus login --api-url https://dev.api.asyncstatus.com

# Use environment variable for API URL
ASYNCSTATUS_API_URL=https://staging.api.asyncstatus.com asyncstatus login

# Logout (also invalidates token on server)
asyncstatus logout
```

#### JWT Token Authentication

The CLI uses **JWT tokens** for authentication with the following flow:

1. **Login**: `POST /auth/sign-in/email` with email/password
2. **Get JWT**: `GET /auth/token` to retrieve JWT token from session
3. **Use JWT**: Include `Authorization: Bearer <token>` in API requests
4. **Logout**: `POST /auth/sign-out` to invalidate token server-side

#### Token Storage

JWT tokens are stored locally at `~/.asyncstatus/config.json`:

```json
{
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Security Features:**
- ✅ File permissions (600) - only your user can read
- ✅ JWT tokens have expiration times
- ✅ Server-side token invalidation on logout
- ✅ Standard practice for CLI tools
- ✅ Better Auth integration with session management

**Environment Configuration:**
- `ASYNCSTATUS_API_URL` - Override default API endpoint
- Default: `https://api.asyncstatus.com`

## Usage Overview

The AsyncStatus CLI provides a powerful yet simple interface for managing your daily status updates. Here's what you can do:

```bash
# Quick commands for daily use
asyncstatus                           # Show current status update
asyncstatus "completed user auth"     # Add a completed task (default)
asyncstatus blocker "waiting for PR"  # Add a blocker
asyncstatus progress "working on UI"  # Add progress update
asyncstatus edit                      # Interactive editor (like git rebase -i)
asyncstatus edit yesterday           # Edit yesterday's status
asyncstatus list                      # View recent updates
asyncstatus undo                      # Remove last item
```

**Example daily workflow:**
```bash
$ asyncstatus
⧗ no updates found for today
  run: asyncstatus done "your task" to create one

$ asyncstatus "completed user authentication API"
⧗ done: completed user authentication API
  ✓ saved

$ asyncstatus progress "working on dashboard redesign"
⧗ progress: working on dashboard redesign
  → saved

$ asyncstatus edit
# Opens editor with current items, add more details...

$ asyncstatus show
⧗ Monday, January 15, 2024
  John Doe (john@example.com)
  Engineering Team

  ✓ completed
    completed user authentication API
  → in progress
    working on dashboard redesign
  ✗ blocked
    blocked on design approval for new components

  mood productive

  notes Made great progress on the auth flow, team meeting at 3pm

  updated 14:32
```

### Quick Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `asyncstatus` | Show current status | `asyncstatus` |
| `asyncstatus "task"` | Add completed task | `asyncstatus "fixed bug #123"` |
| `asyncstatus done "task"` | Add completed task (explicit) | `asyncstatus done "deployed to prod"` |
| `asyncstatus progress "task"` | Add progress item | `asyncstatus progress "working on API"` |
| `asyncstatus blocker "issue"` | Add blocker | `asyncstatus blocker "waiting for approval"` |
| `asyncstatus edit` | Interactive editor (today) | `asyncstatus edit` |
| `asyncstatus edit [date]` | Edit specific date | `asyncstatus edit yesterday` |
| `asyncstatus show` | Show today's status | `asyncstatus show` |
| `asyncstatus list [days]` | List recent updates | `asyncstatus list 7` |
| `asyncstatus undo` | Remove last item | `asyncstatus undo` |
| `asyncstatus login` | Login to account | `asyncstatus login` |
| `asyncstatus logout` | Logout and clear token | `asyncstatus logout` |

### Core Features

#### 🚀 Quick Status Updates

Add status updates with simple commands:

```bash
# Add a completed task (default behavior)
$ asyncstatus "finished the API endpoint"
⧗ done: finished the API endpoint
  ✓ saved

# Explicitly add a completed task
$ asyncstatus done "finished the API endpoint"
⧗ done: finished the API endpoint
  ✓ saved

# Add a blocker
$ asyncstatus blocker "waiting for API approval"
⧗ blocked: waiting for API approval
  ✗ saved

# Add a progress update
$ asyncstatus progress "working on user dashboard"
⧗ progress: working on user dashboard
  → saved
```

#### ✏️ Interactive Editor (Like `git rebase -i`)

Edit your status update interactively in your preferred editor:

```bash
# Edit today's status update
$ asyncstatus edit

# Edit yesterday's status update
$ asyncstatus edit yesterday

# Edit a specific date
$ asyncstatus edit 2024-01-15

# Edit relative dates
$ asyncstatus edit "3 days ago"
$ asyncstatus edit "2 weeks ago"
$ asyncstatus edit "1 month ago"
```

**Example editor session:**
```
# Edit your status update for Monday, January 15, 2024

done finished the user authentication flow
progress working on the dashboard UI
blocker waiting for design approval on new components
done fixed critical bug in payment processing

mood productive
notes Great progress today, team collaboration was excellent

#
# Commands:
#   done <text>     = completed task
#   progress <text> = work in progress
#   blocker <text>  = blocked task
#
# Special fields:
#   mood <mood>      = your current mood
#   notes <text>    = additional notes
#
# Lines starting with # are ignored
# You can reorder lines to change the order
# Delete lines to remove items
# Add new lines to add items
#
# Example:
#   done Implemented user authentication
#   progress Working on payment integration
#   blocker Waiting for API keys
#   mood productive
#   notes Great progress today, team collaboration was excellent
```

**Output after saving:**
```
⧗ status update saved
```

**If no changes were made:**
```
⧗ no changes made
```

#### 📊 View Status Updates

```bash
# Show current status update
$ asyncstatus show
⧗ Monday, January 15, 2024
  John Doe (john@example.com)
  Engineering Team

  ✓ completed
    finished the API endpoint
  → in progress
    working on user dashboard  
  ✗ blocked
    waiting for API approval

  mood productive

  notes Great progress today, team collaboration was excellent

  updated 14:32

# Show status without any items
$ asyncstatus show
⧗ no updates found for today
  run: asyncstatus done "your task" to create one

# View recent status updates
$ asyncstatus list
⧗ today's updates
  1 update(s)

  1. Monday, January 15
     John Doe (john@example.com)
     Engineering Team
     ✓3 →1 ✗1
     • finished the API endpoint
     • working on user dashboard
     • waiting for API approval
     mood productive
     notes Great progress today, team collaboration was excellent
     14:32

# List past 7 days
$ asyncstatus list 7
⧗ past 7 days
  3 update(s)

  1. Monday, January 15
     John Doe (john@example.com)
     Engineering Team
     ✓3 →1 ✗1
     • finished the API endpoint
     • working on user dashboard
     • waiting for API approval
     mood productive
     notes Great progress today, team collaboration was excellent
     14:32
  ────────────────────────────────────
  2. Sunday, January 14
     John Doe (john@example.com)
     Engineering Team
     ✓2
     • completed code review
     • deployed to staging
     mood focused
     16:45
```

#### ↩️ Undo Operations

```bash
# Remove the last status update item
$ asyncstatus undo
⧗ undoing last item...
  ✓ removed last item

# Try to undo when no items exist  
$ asyncstatus undo
⧗ failed: no status update items to remove
  run: asyncstatus login first
```

#### 🔧 Editor Configuration

The CLI respects your editor preferences in this order:

1. `ASYNCSTATUS_EDITOR` - AsyncStatus-specific editor
2. `GIT_EDITOR` - Git editor environment variable
3. `VISUAL` - Visual editor environment variable  
4. `EDITOR` - Standard editor environment variable
5. `git config core.editor` - Git configuration (local then global)
6. `git var GIT_EDITOR` - Git's internal editor detection
7. System fallbacks: `vi`, `vim`, `nano`

```bash
# Set AsyncStatus-specific editor
export ASYNCSTATUS_EDITOR="code --wait"

# Or use your existing Git editor setup
git config --global core.editor "vim"

# The edit command will automatically use your preferred editor
$ asyncstatus edit
# Opens in VS Code, Vim, or whatever you've configured
```

#### 🌐 Environment Configuration

```bash
# Use different API environment
export ASYNCSTATUS_API_URL="https://staging.api.asyncstatus.com"
asyncstatus login

# Override editor for AsyncStatus only
export ASYNCSTATUS_EDITOR="nano"

# Use existing environment variables
export EDITOR="vim"
export VISUAL="code --wait"
```

## Development

### Build

```bash
make build
```

### Build for multiple platforms

```bash
make build-all
```

### Run tests

```bash
make test
```

### Other commands

```bash
make help  # Show all available commands
```

## Versioning

The CLI uses git tags for versioning. Version information is embedded during build time using ldflags.

## Installation Script

The `install.sh` script provides a convenient way to install the CLI:

```bash
# Basic usage (installs to ~/.asyncstatus/cli)
./install.sh

# Install specific version
./install.sh --version v1.0.0

# Install to system directory
sudo ./install.sh --dir /usr/local/bin

# Install to user's local bin
./install.sh --dir $HOME/.local/bin

# Show help
./install.sh --help
```

### Features:
- ✅ Automatic platform detection (Linux, macOS, Windows)
- ✅ Architecture detection (amd64, arm64)
- ✅ Downloads from GitHub releases
- ✅ Verifies downloads
- ✅ Handles permissions
- ✅ PATH validation
- ✅ Colored output and error handling
- ✅ Built-in uninstall functionality

### Uninstall

To remove the CLI:

```bash
# Using the install script
./install.sh --uninstall

# Or manually
rm -rf ~/.asyncstatus/cli
# Then remove from your PATH in ~/.bashrc, ~/.zshrc, etc.
```

## Release Process

The CLI uses automated GitHub Actions for building and releasing. There are two ways to create a release:

### Creating a Release

#### Option 1: Tag Release (Recommended)
```bash
# Create and push a version tag
git tag cli/v1.0.0
git push origin cli/v1.0.0
```

#### Option 2: Manual Workflow Dispatch
1. Go to GitHub Actions in the repository
2. Select "Build and Release CLI" workflow
3. Click "Run workflow"
4. Optionally enter a version (e.g., `v1.0.1`)

### Automated Release Process

The automated workflow will:
1. **Build** binaries for all supported platforms:
   - Linux (amd64, arm64)
   - macOS (amd64, arm64) 
   - Windows (amd64)
2. **Test** the code with comprehensive checks
3. **Create** a GitHub release with:
   - Pre-compiled binaries
   - SHA256 checksums
   - Installation instructions
   - Release notes

### Testing Releases Locally

Before creating a release, test the build process locally:

```bash
make release
```

This will:
- Build for all platforms
- Generate checksums
- Verify all artifacts are created correctly

### Supported Platforms

The CLI is automatically built and tested for:
- **Linux**: amd64, arm64
- **macOS**: amd64 (Intel), arm64 (Apple Silicon)
- **Windows**: amd64

### Installation After Release

Once released, users can install using:

```bash
# Automatic installation
curl -fsSL https://raw.githubusercontent.com/asyncstatus/web-v3/main/apps/cli/install.sh | bash

# Manual download from GitHub releases
# Download appropriate binary from: https://github.com/asyncstatus/web-v3/releases
```
