import { createWebMiddleware } from "@octokit/webhooks";
import { Hono } from "hono";

import type { HonoEnv } from "../lib/env";

export const githubWebhooksRouter = new Hono<HonoEnv>().on(
  ["POST"],
  "*",
  (c) => {
    const githubWebhooks = c.get("githubWebhooks");

    githubWebhooks.onAny(async (event) => {
      console.log("Received event", event);
      const queue = c.env.GITHUB_WEBHOOK_EVENTS_QUEUE;
      await queue.send(event, { contentType: "json" });
    });

    return createWebMiddleware(githubWebhooks, { path: "/github/webhooks" })(
      c.req.raw,
    );
  },
);
