# ⧗ AsyncStatus

> **Modern status updates for async teams**

AsyncStatus is a lightweight, developer-friendly platform that helps distributed teams stay synchronized without the overhead of constant meetings or status check-ins. Track progress, identify blockers, and share updates across multiple interfaces - CLI, web app, and Slack.

## 🚀 Why AsyncStatus?

**The Problem:** Remote and async teams struggle with visibility. Daily standups interrupt flow, Slack updates get lost, and managers lack insight into team progress and blockers.

**The Solution:** AsyncStatus provides structured, async status updates that integrate seamlessly into existing workflows:

- **Developers** can update status from the terminal without context switching
- **Teams** get visibility into progress and blockers without meetings  
- **Managers** see real-time team health and can unblock work faster
- **Everyone** stays informed without notification overload

## ✨ Key Features

- **🖥️ CLI-First:** Git-style interface for developers (`asyncstatus edit` works like `git rebase -i`)
- **🌐 Web Dashboard:** Rich editor with team views and analytics
- **💬 Slack Integration:** Native slash commands and channel notifications
- **📊 Progress Tracking:** Track completed tasks, work in progress, and blockers
- **😊 Mood & Context:** Optional mood tracking and detailed notes
- **📅 Time-Aware:** Natural date parsing ("yesterday", "3 days ago")
- **🔐 Team-Ready:** Multi-team support with proper authentication

## 🏗️ Architecture

This is a **TypeScript monorepo** built with modern tooling:

```
asyncstatus/
├── apps/
│   ├── api/           # Hono API server (Cloudflare Workers)
│   ├── cli/           # Go CLI application
│   ├── web-app/       # React dashboard (Vite + TanStack Router)
│   └── marketing-app/ # Next.js marketing site
├── packages/
│   ├── ui/            # Shared React components
│   ├── editor/        # Rich text editor for status updates
│   ├── email/         # Email templates
│   └── *-config/      # Shared configs
└── Package manager: Bun
```

**Tech Stack:**
- **Runtime:** Bun (fast JavaScript runtime)
- **API:** Hono on Cloudflare Workers
- **Database:** SQLite with Drizzle ORM (Turso for production)
- **Frontend:** React with TanStack Router
- **CLI:** Go with Cobra
- **Deployment:** Cloudflare Workers + Pages

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) >= 1.2
- [Go](https://golang.org) >= 1.21 (for CLI development)

### 1. Clone and Install
```bash
git clone https://github.com/asyncstatus/asyncstatus.git
cd asyncstatus
bun install
```

### 2. Start the API
```bash
cd apps/api
bun dev:turso  # Start local database
# In a new terminal:
bun run dev    # Start API server
```

### 3. Start the Web App
```bash
cd apps/web-app
bun run dev
```

The web app will be available at `http://localhost:3000`

### 4. Try the CLI (Optional)
```bash
cd apps/cli
go run main.go version
```

## 📖 Usage Examples

### CLI Quick Start
```bash
# Login to your account
asyncstatus login

# Add a completed task
asyncstatus "finished user authentication"

# Add work in progress
asyncstatus progress "working on dashboard UI"

# Add a blocker
asyncstatus blocker "waiting for API approval"

# Interactive editing (like git rebase -i)
asyncstatus edit

# View current status
asyncstatus show
```

### Slack Integration
```bash
# In any Slack channel:
/asyncstatus Working on the quarterly report
```

### Web Dashboard
- Rich text editor with markdown support
- Team overview and individual status pages
- Historical views and progress tracking
- Export capabilities for reports

## 🔧 Development

### Database Migrations
When modifying the database schema:

```bash
cd apps/api

# 1. Update schema in src/db/schema.ts
# 2. Generate migration
bun run migrate:generate

# 3. Apply migration
bun run migrate
```

### Running Tests
```bash
# Run all tests
bun test

# Run specific app tests
cd apps/api && bun test
cd apps/web-app && bun test
```

### Code Quality
```bash
# Format and lint
bun run format
bun run lint

# Type checking
bun run typecheck
```

## 🚢 Deployment

### API (Cloudflare Workers)
```bash
cd apps/api
bun run deploy
```

### Web Apps (Cloudflare Pages)
```bash
cd apps/web-app
bun run build
bun run deploy

cd apps/marketing-app  
bun run build
bun run deploy
```

### CLI Releases
CLI binaries are built and released automatically via GitHub Actions.

## 🏢 For Teams

AsyncStatus is designed for teams who value:

- **Async Communication:** Reduce meeting overhead
- **Developer Experience:** CLI-first workflow that respects developer tools
- **Transparency:** Everyone knows what everyone is working on
- **Actionable Insights:** Identify and resolve blockers quickly

**Perfect for:**
- Remote engineering teams
- Product teams coordinating across time zones
- Agencies managing multiple client projects
- Any team practicing async-first communication

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Project Structure
- Each `apps/*` directory has its own README with specific setup instructions
- Shared code lives in `packages/*`
- Use [Conventional Commits](https://conventionalcommits.org/) for commit messages

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Website:** [asyncstatus.com](https://asyncstatus.com)
- **Documentation:** [docs.asyncstatus.com](https://docs.asyncstatus.com)
- **CLI Releases:** [GitHub Releases](https://github.com/asyncstatus/asyncstatus/releases)
- **Issues:** [GitHub Issues](https://github.com/asyncstatus/asyncstatus/issues)

---

Built with ❤️ by the AsyncStatus team
