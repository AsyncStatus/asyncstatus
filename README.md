# AsyncStatus

run app locally:

### Run db:

```bash
cd apps/api
bun dev:turso
# new terminal
bun run dev
```

### Run app:

```bash
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

### Example: Adding a Slack Username Field

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

### Troubleshooting

- **Migration not applying**: Make sure your local database is running (`bun dev:turso`)
- **Schema errors**: Check the Drizzle ORM documentation for correct type definitions
- **Conflict errors**: If you have conflicts between local and remote databases, you may need to reset your local database or use `drizzle-kit push --force`
