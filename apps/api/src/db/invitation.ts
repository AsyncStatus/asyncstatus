import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";
import { team } from "./team";
import { user } from "./user";

export const invitation = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    name: text("name"),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("organization_invitation_id_index").on(t.organizationId),
    index("inviter_invitation_id_index").on(t.inviterId),
  ],
);

export const Invitation = createSelectSchema(invitation, {
  email: z.email(),
});
export type Invitation = z.output<typeof Invitation>;
export const InvitationInsert = createInsertSchema(invitation, {
  email: z.email(),
});
export type InvitationInsert = z.output<typeof InvitationInsert>;
export const InvitationUpdate = createUpdateSchema(invitation, {
  email: z.email(),
});
export type InvitationUpdate = z.output<typeof InvitationUpdate>;
