import {
  TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY,
  TypedHandlersError,
} from "@asyncstatus/typed-handlers";
import { typedHandlersHonoServer } from "@asyncstatus/typed-handlers/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { createContext, type HonoEnv } from "./lib/env";
import {
  getChangelogBySlugHandler,
  listChangelogsByRepoHandler,
  listReposByOwnerHandler,
  startChangelogGenerationHandler,
} from "./typed-handlers/changelog-handlers";

const app = new Hono<HonoEnv>()
  .use(
    "*",
    cors({
      origin: (origin, c) => {
        if (c.env.NODE_ENV === "development") {
          return origin;
        }
        if (origin.endsWith("asyncstatus.com")) {
          return origin;
        }
        if (origin.endsWith("changelogs.ai")) {
          return origin;
        }
        if (origin.endsWith("chlgs.ai")) {
          return origin;
        }
        return "https://changelogs.ai";
      },
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Content-Disposition",
        "Content-Length",
        "ETag",
        "Cache-Control",
      ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use(async (c, next) => {
    const context = await createContext(c);
    c.set("db", context.db);
    c.set("resend", context.resend);
    c.set("anthropicClient", context.anthropicClient);
    c.set("openRouterProvider", context.openRouterProvider);
    c.set("voyageClient", context.voyageClient);
    c.set("workflow", context.workflow);
    c.set("slack", context.slack);
    c.set("discord", context.discord);
    c.set("betterAuthUrl", context.betterAuthUrl);
    c.set("github", context.github);
    c.set("gitlab", context.gitlab);
    c.set("linear", context.linear);
    return next();
  })
  .onError((err, c) => {
    console.error(err);
    if (err instanceof TypedHandlersError) {
      return c.json(
        { type: err.name, message: err.message, code: err.code, cause: err.cause },
        TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY[
          err.code ?? "INTERNAL_SERVER_ERROR"
        ] as ContentfulStatusCode,
      );
    }
    return c.json({ message: "Unknown error", code: "INTERNAL_SERVER_ERROR", cause: err }, 500);
  });

const typedHandlersApp = typedHandlersHonoServer(
  app,
  [
    listChangelogsByRepoHandler,
    listReposByOwnerHandler,
    getChangelogBySlugHandler,
    startChangelogGenerationHandler,
  ],
  {
    getContext: (c) => ({
      db: c.get("db"),
      resend: c.get("resend"),
      anthropicClient: c.get("anthropicClient"),
      openRouterProvider: c.get("openRouterProvider"),
      voyageClient: c.get("voyageClient"),
      discord: c.get("discord"),
      slack: c.get("slack"),
      changelogAppUrl: c.env.CHANGELOG_APP_URL,
      workflow: c.get("workflow"),
      betterAuthUrl: c.env.BETTER_AUTH_URL,
      github: c.get("github"),
      gitlab: c.get("gitlab"),
      linear: c.get("linear"),
    }),
  },
);

export default {
  fetch: typedHandlersApp.fetch,
};
export type App = typeof app;

export { ChangelogGenerationJobWorkflow } from "./workflows/github/changelog-generation-job";
