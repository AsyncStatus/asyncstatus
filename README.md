# AsyncStatus

> **Modern status updates for async teams**

AsyncStatus is a lightweight, developer-friendly platform that helps distributed teams stay synchronized without the overhead of constant meetings or status check-ins. Track progress, identify blockers, and share updates across multiple interfaces - CLI, web app, and Slack.

## Why AsyncStatus?

**The Problem:** Remote and async teams struggle with visibility. Daily standups interrupt flow, Slack updates get lost, and managers lack insight into team progress and blockers.

**The Solution:** AsyncStatus provides structured, async status updates that integrate seamlessly into existing workflows:

- **Developers** can update status from the terminal without context switching
- **Teams** get visibility into progress and blockers without meetings  
- **Managers** see real-time team health and can unblock work faster
- **Everyone** stays informed without notification overload

## Key Features

- **CLI-First:** Git-style interface for developers (`asyncstatus edit` works like `git rebase -i`)
- **Web Dashboard:** Rich editor with team views and analytics
- **Slack Integration:** Native slash commands and channel notifications
- **Progress Tracking:** Track completed tasks, work in progress, and blockers
- **Mood & Context:** Optional mood tracking and detailed notes
- **Time-Aware:** Natural date parsing ("yesterday", "3 days ago")
- **Team-Ready:** Multi-team support with proper authentication

## Architecture

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

## Quick Start

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

### 4. Start the Marketing App (Optional)
```bash
cd apps/marketing-app
bun run dev
```

### 5. Try the CLI (Optional)
```bash
cd apps/cli
go run main.go version
```

## Usage Examples

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

## Development

### Database Setup and Migrations

AsyncStatus uses [Drizzle ORM](https://orm.drizzle.team/) for database management with SQLite/Turso. When making changes to the database schema, you need to create and apply migrations.

#### Understanding the Migration Process

1. **Schema Definition**: Database tables are defined in `apps/api/src/db/schema.ts`
2. **Migration Generation**: After changing the schema, you generate SQL migration files
3. **Migration Application**: Apply the migrations to update the database structure

#### Steps to Create and Apply Migrations

**1. Update the Schema**

Edit `apps/api/src/db/schema.ts` to make your schema changes. For example, to add a new field to a table:

```typescript
export const member = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    // ... existing fields

    // Add a new field
    newField: text("new_field"),
  }
  // ... indexes
);
```

**2. Generate the Migration**

Run the migration generation script from the API directory:

```bash
cd apps/api
bun run migrate:generate
```

This will create a new SQL migration file in the `apps/api/drizzle` directory (e.g., `0006_new_migration.sql`).

**3. Apply the Migration**

Apply the migration to update the database:

```bash
cd apps/api
bun run migrate
```

#### Example: Adding a Slack Username Field

Here's an example of how we added the `slackUsername` field to the `member` table:

1. **Updated the schema** in `apps/api/src/db/schema.ts`:

   ```typescript
   export const member = sqliteTable(
     "member",
     {
       // ... existing fields
       // Optional Slack username - nullable by default
       slackUsername: text("slack_username"),
       // ... other fields
     }
     // ... indexes
   );
   ```

2. **Generated the migration**:

   ```bash
   cd apps/api
   bun run migrate:generate
   ```

   This created `apps/api/drizzle/0005_flashy_polaris.sql` with:

   ```sql
   ALTER TABLE `member` ADD `slack_username` text;
   ```

3. **Applied the migration**:
   ```bash
   cd apps/api
   bun run migrate
   ```

#### Database Studio

For database inspection and management, you can use Drizzle Studio:

```bash
cd apps/api
bun studio
```

This opens a web-based database browser where you can:
- View and edit table data
- Inspect database schema
- Run SQL queries
- Manage relationships

The studio will be available at `http://localhost:4983` (or another port if specified).

#### Troubleshooting

- **Migration not applying**: Make sure your local database is running (`bun dev:turso`)
- **Schema errors**: Check the Drizzle ORM documentation for correct type definitions
- **Conflict errors**: If you have conflicts between local and remote databases, you may need to reset your local database or use `drizzle-kit push --force`

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

## Deployment

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

## For Teams

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

## Contributing

We welcome contributions! This section provides everything you need to get started with local development.

### Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [Go](https://golang.org) >= 1.21 (for CLI development)
- [Git](https://git-scm.com)

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/asyncstatus.git
   cd asyncstatus
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Set up Environment Variables**
   ```bash
   cd apps/api
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your configuration
   ```

4. **Start the Database**
   ```bash
   cd apps/api
   bun dev:turso
   ```

5. **Run Database Migrations**
   ```bash
   # In a new terminal, from apps/api directory
   bun run migrate
   ```

6. **Start the API Server**
   ```bash
   # From apps/api directory
   bun run dev
   ```

7. **Start the Web App**
   ```bash
   # In a new terminal
   cd apps/web-app
   bun run dev
   ```

8. **Start the Marketing App (Optional)**
   ```bash
   # In a new terminal
   cd apps/marketing-app
   bun run dev
   ```

### Project Structure

- Each `apps/*` directory has its own README with specific setup instructions
- Shared code lives in `packages/*`
- Use [Conventional Commits](https://conventionalcommits.org/) for commit messages
- Follow the existing code style and patterns

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   bun test
   bun run typecheck
   bun run lint
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Ensure all CI checks pass

### Development Tips

- **Hot Reloading**: All development servers support hot reloading
- **Database**: Use `bun dev:turso` for a local SQLite database that matches production
- **Database Studio**: Use `cd apps/api && bun studio` to open a web interface for database inspection
- **CLI Testing**: Build the CLI with `go build` in the `apps/cli` directory
- **Debugging**: Each app has debug configurations for popular IDEs

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **Website:** [asyncstatus.com](https://asyncstatus.com)
- **Documentation:** [docs.asyncstatus.com](https://docs.asyncstatus.com)
- **CLI Releases:** [GitHub Releases](https://github.com/asyncstatus/asyncstatus/releases)
- **Issues:** [GitHub Issues](https://github.com/asyncstatus/asyncstatus/issues)

---

Built with love by the AsyncStatus team
