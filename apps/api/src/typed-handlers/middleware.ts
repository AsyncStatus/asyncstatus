import { TypedHandlersError, typedMiddleware } from "@asyncstatus/typed-handlers";
import { desc, eq, or } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { member, organization } from "../db";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";

interface JWTSessionData {
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  userId: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

interface JWTUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  activeOrganizationSlug: string;
  timezone: string;
  autoDetectTimezone: boolean;
}

interface JWTPayload {
  session: JWTSessionData;
  user: JWTUser;
  iat: number;
  iss: string;
  aud: string;
  exp: number;
  sub: string;
}

export const requiredSession = typedMiddleware<TypedHandlersContextWithSession>(
  async ({ session }, next) => {
    if (!session) {
      throw new TypedHandlersError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return next();
  },
);

export const requiredJwt = typedMiddleware<TypedHandlersContextWithSession>(
  async ({ req, set, betterAuthUrl }, next) => {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new TypedHandlersError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const jwksUrl = new URL("/auth/jwks", betterAuthUrl);

      const JWKS = createRemoteJWKSet(jwksUrl);

      const { payload } = await jwtVerify(token, JWKS, {
        issuer: betterAuthUrl,
        audience: betterAuthUrl,
      });

      const jwtPayload = payload as unknown as JWTPayload;
      const jwtSession = jwtPayload.session;
      const jwtUser = jwtPayload.user;

      if (!jwtSession || !jwtUser) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "Invalid token payload",
        });
      }

      const session = {
        session: {
          ...jwtSession,
          activeOrganizationSlug: jwtUser.activeOrganizationSlug,
        },
        user: jwtUser,
      };

      set("session", session);
      return next();
    } catch (error) {
      console.error("JWT validation failed:", error);
      throw new TypedHandlersError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  },
);

export const requiredOrganization = typedMiddleware<TypedHandlersContextWithOrganization>(
  async ({ req, db, set, session }, next) => {
    let idOrSlug = req.url.includes("/organizations/")
      ? req.url.split("/organizations/")[1]?.split("/")[0]
      : undefined;
    idOrSlug = idOrSlug?.endsWith("?") ? idOrSlug.slice(0, -1) : idOrSlug;
    if (!idOrSlug) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Organization ID or slug is required",
      });
    }

    const org = await db.query.organization.findFirst({
      where: or(eq(organization.id, idOrSlug), eq(organization.slug, idOrSlug)),
      with: {
        members: {
          limit: 1,
          where: eq(member.userId, session.user.id),
          orderBy: [desc(member.role)],
        },
      },
    });
    if (!org) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }
    const { members, ...restOrg } = org;
    if (!members[0]) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    set("organization", restOrg);
    set("member", members[0]);
    return next();
  },
);
