# ⧗ AsyncStatus CLI

A command-line interface for managing async status updates.

## Installation

### Quick Install (Recommended)

Install the latest version using our installation script:

```bash
# Install to ~/.asyncstatus/cli (no sudo required)
curl -fsSL https://raw.githubusercontent.com/asyncstatus/web-v3/main/apps/cli/install.sh | bash

# Add to your PATH (add this to your ~/.bashrc, ~/.zshrc, etc.)
echo 'export PATH="$HOME/.asyncstatus/cli:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Alternative installation locations:

```bash
# Install to system directory (requires sudo)
curl -fsSL https://raw.githubusercontent.com/asyncstatus/web-v3/main/apps/cli/install.sh | sudo INSTALL_DIR="/usr/local/bin" bash

# Install to user's local bin
curl -fsSL https://raw.githubusercontent.com/asyncstatus/web-v3/main/apps/cli/install.sh | INSTALL_DIR="$HOME/.local/bin" bash
```

### Manual Installation

Download the appropriate binary for your platform from the [latest release](https://github.com/asyncstatus/web-v3/releases/latest):

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

### Quick status updates

```bash
# Add a completed task (default behavior)
asyncstatus "finished the API endpoint"

# Explicitly add a completed task
asyncstatus done "finished the API endpoint"

# Add a blocker
asyncstatus blocker "waiting for API approval"

# Add a progress update
asyncstatus progress "working on user dashboard"

# Remove the previous status update
asyncstatus undo
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

When publishing releases:

1. Tag the release: `git tag v1.0.0`
2. Push the tag: `git push origin v1.0.0`
3. Build all platforms: `make build-all`
4. Upload binaries to GitHub release
5. Users can install via: `curl -fsSL .../install.sh | bash`
