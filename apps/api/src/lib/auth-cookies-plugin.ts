import { parseSetCookieHeader } from "better-auth/cookies";
import { createAuthMiddleware } from "better-auth/plugins";
import type { BetterAuthPlugin } from "better-auth/types";

export const authCookiesPlugin = () => {
  return {
    id: "auth-cookies",
    hooks: {
      after: [
        {
          matcher(ctx) {
            return true;
          },
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.responseHeaders;
            if (returned instanceof Headers) {
              const setCookies = returned?.get("set-cookie");
              if (!setCookies) return;
              const parsed = parseSetCookieHeader(setCookies);
              parsed.forEach((value, key) => {
                ctx.context.responseHeaders?.append(
                  "set-cookie",
                  `${key}=${value.value}; Domain=.asyncstatus.com; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=${value["max-age"]}; Expires=${value.expires}`,
                );
              });
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
};
