import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";
import { fetchAllPages, makeGraphApiRequest } from "./common";

type FetchAndSyncUsersParams = {
  db: Db;
  integrationId: string;
  graphAccessToken: string;
  tenantId: string;
};

interface User {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  userType?: string;
}

interface TeamMember {
  userId: string;
  displayName: string;
  email?: string;
  roles?: string[];
}

export async function fetchAndSyncUsers({
  db,
  integrationId,
  graphAccessToken,
  tenantId,
}: FetchAndSyncUsersParams) {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.id, integrationId),
  });

  if (!integration) {
    throw new Error("Integration not found");
  }

  const usersToInsert: schema.TeamsUserInsert[] = [];
  const processedUserIds = new Set<string>();

  // If we have a specific team, fetch team members
  if (integration.teamId) {
    try {
      const members: TeamMember[] = [];
      for await (const page of fetchAllPages<any>(
        `/teams/${integration.teamId}/members`,
        graphAccessToken
      )) {
        members.push(...page);
      }

      // For each team member, fetch full user details
      for (const member of members) {
        if (processedUserIds.has(member.userId)) continue;
        processedUserIds.add(member.userId);

        try {
          const user = await makeGraphApiRequest<User>(
            `/users/${member.userId}`,
            graphAccessToken
          );

          usersToInsert.push({
            id: generateId(),
            integrationId,
            userId: user.id,
            displayName: user.displayName,
            email: user.mail ?? member.email ?? null,
            userPrincipalName: user.userPrincipalName ?? null,
            givenName: user.givenName ?? null,
            surname: user.surname ?? null,
            jobTitle: user.jobTitle ?? null,
            department: user.department ?? null,
            officeLocation: user.officeLocation ?? null,
            mobilePhone: user.mobilePhone ?? null,
            businessPhones: user.businessPhones ? JSON.stringify(user.businessPhones) : null,
            isGuest: user.userType === "Guest",
            isDeleted: false,
            tenantId,
            roles: member.roles ? member.roles.join(",") : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (error) {
          console.error(`Failed to fetch user details for ${member.userId}:`, error);
          // Still add basic member info even if full details fail
          usersToInsert.push({
            id: generateId(),
            integrationId,
            userId: member.userId,
            displayName: member.displayName,
            email: member.email ?? null,
            userPrincipalName: null,
            givenName: null,
            surname: null,
            jobTitle: null,
            department: null,
            officeLocation: null,
            mobilePhone: null,
            businessPhones: null,
            isGuest: false,
            isDeleted: false,
            tenantId,
            roles: member.roles ? member.roles.join(",") : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch team members for team ${integration.teamId}:`, error);
    }
  } else {
    // No specific team, fetch all users in the tenant (might be limited by permissions)
    try {
      for await (const page of fetchAllPages<User>("/users", graphAccessToken)) {
        for (const user of page) {
          if (processedUserIds.has(user.id)) continue;
          processedUserIds.add(user.id);

          usersToInsert.push({
            id: generateId(),
            integrationId,
            userId: user.id,
            displayName: user.displayName,
            email: user.mail ?? null,
            userPrincipalName: user.userPrincipalName ?? null,
            givenName: user.givenName ?? null,
            surname: user.surname ?? null,
            jobTitle: user.jobTitle ?? null,
            department: user.department ?? null,
            officeLocation: user.officeLocation ?? null,
            mobilePhone: user.mobilePhone ?? null,
            businessPhones: user.businessPhones ? JSON.stringify(user.businessPhones) : null,
            isGuest: user.userType === "Guest",
            isDeleted: false,
            tenantId,
            roles: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch all users:", error);
    }
  }

  // Batch upsert users
  const batchUpserts = usersToInsert.map((user) => {
    return db
      .insert(schema.teamsUser)
      .values(user)
      .onConflictDoUpdate({
        target: schema.teamsUser.userId,
        setWhere: eq(schema.teamsUser.userId, user.userId),
        set: {
          displayName: user.displayName,
          email: user.email,
          userPrincipalName: user.userPrincipalName,
          givenName: user.givenName,
          surname: user.surname,
          jobTitle: user.jobTitle,
          department: user.department,
          officeLocation: user.officeLocation,
          mobilePhone: user.mobilePhone,
          businessPhones: user.businessPhones,
          isGuest: user.isGuest,
          roles: user.roles,
          updatedAt: new Date(),
        },
      });
  });

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }
}