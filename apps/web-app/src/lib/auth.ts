import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const roleOptions = [
  {
    label: "Member",
    value: "member",
    description:
      "Can interact with status updates, teams, own profile and personal settings.",
  },
  {
    label: "Admin",
    value: "admin",
    description:
      "Everything a member can do, plus the ability to manage members, teams and organization settings.",
  },
  {
    label: "Owner",
    value: "owner",
    description: "Every permission.",
  },
];

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  basePath: "/auth",
  plugins: [organizationClient({ teams: { enabled: true } })],
});
