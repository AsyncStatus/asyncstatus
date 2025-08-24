# Tech Stack

- **Frontend**: Built with react.
- **Backend**: Hono API is using Drizzle ORM for database management.
- **Database**: Turso database
- **Package Manager**: Uses `bun` for fast and efficient dependency management and script execution.
- **Hosting**: Cloudflare (+ Wrangler for local development)

### Contribution Guidelines

![Let's Build](https://media.giphy.com/media/mEtegV0gvQEQ74ZDwX/giphy.gif?cid=ecf05e47eue44oixrtmszinj5ie8oo3jziglcgl25cj4tus1&ep=v1_gifs_related&rid=giphy.gif&ct=g)

We welcome contributions from the community! Please follow the steps outlined in this document to set up your local environment, make changes, and submit pull requests.

## Run App Locally:

### Run Db & Api:

```bash
cp .env.example .env.development
cd apps/api
bun dev:turso
# new terminal
bun run dev
```

### Run App:

```bash
cp .example.vars .dev.vars
cd apps/web-app
bun run dev
```

## Database Migrations

AsyncStatus uses [Drizzle ORM](https://orm.drizzle.team/) for database management with SQLite/Turso. When making changes to the database schema, you need to create and apply migrations.

### Understanding the Migration Process

1. **Schema Definition**: Database tables are defined in `apps/api/src/db/schema.ts`
2. **Migration Generation**: After changing the schema, you generate SQL migration files
3. **Migration Application**: Apply the migrations to update the database structure

### Steps to Create and Apply Migrations

#### 1. Update the Schema

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

#### 2. Generate the Migration

Run the migration generation script from the API directory:

```bash
cd apps/api
bun run migrate:generate
```

This will create a new SQL migration file in the `apps/api/drizzle` directory (e.g., `0006_new_migration.sql`).

#### 3. Apply the Migration

Apply the migration to update the database:

```bash
cd apps/api
bun run migrate
```


### Troubleshooting

- **Migration not applying**: Make sure your local database is running (`bun dev:turso`)
- **Schema errors**: Check the Drizzle ORM documentation for correct type definitions
- **Conflict errors**: If you have conflicts between local and remote databases, you may need to reset your local database or use `drizzle-kit push --force`
