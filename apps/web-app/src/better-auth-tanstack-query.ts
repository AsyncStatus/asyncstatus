import { queryOptions } from "@tanstack/react-query";
import { getIncomingHeaders } from "@/get-incoming-headers";
import { authClient } from "@/lib/auth";
import { mutationOptions } from "@/lib/utils";

export function sessionBetterAuthQueryOptions() {
  return queryOptions({
    queryKey: ["session"],
    staleTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const headers = new Headers();
      headers.set("cookie", (getIncomingHeaders() as any)["cookie"] ?? "");
      const { data, error } = await authClient.getSession({
        fetchOptions: { signal, headers },
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function loginEmailMutationOptions() {
  return mutationOptions({
    mutationKey: ["loginEmail"],
    mutationFn: async (input: Parameters<typeof authClient.signIn.email>[0]) => {
      const { data, error } = await authClient.signIn.email(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function loginSocialMutationOptions() {
  return mutationOptions({
    mutationKey: ["loginGithub"],
    mutationFn: async (input: Parameters<typeof authClient.signIn.social>[0]) => {
      const { data, error } = await authClient.signIn.social(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function linkSocialMutationOptions() {
  return mutationOptions({
    mutationKey: ["linkSocial"],
    mutationFn: async (input: Parameters<typeof authClient.linkSocial>[0]) => {
      const { data, error } = await authClient.linkSocial(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function signUpEmailMutationOptions() {
  return mutationOptions({
    mutationKey: ["signUpEmail"],
    mutationFn: async (input: Parameters<typeof authClient.signUp.email>[0]) => {
      const { data, error } = await authClient.signUp.email(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function sendVerificationEmailMutationOptions() {
  return mutationOptions({
    mutationKey: ["sendVerificationEmail"],
    mutationFn: async (input: Parameters<typeof authClient.sendVerificationEmail>[0]) => {
      const headers = new Headers();
      headers.set("cookie", (getIncomingHeaders() as any)["cookie"] ?? "");
      const { data, error } = await authClient.sendVerificationEmail(input, { headers });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}
export function forgotPasswordMutationOptions() {
  return mutationOptions({
    mutationKey: ["forgotPassword"],
    mutationFn: async (input: Parameters<typeof authClient.forgetPassword>[0]) => {
      const headers = new Headers();
      headers.set("cookie", (getIncomingHeaders() as any)["cookie"] ?? "");
      const { data, error } = await authClient.forgetPassword(input, { headers });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function resetPasswordMutationOptions() {
  return mutationOptions({
    mutationKey: ["resetPassword"],
    mutationFn: async (input: Parameters<typeof authClient.resetPassword>[0]) => {
      const headers = new Headers();
      headers.set("cookie", (getIncomingHeaders() as any)["cookie"] ?? "");
      const { data, error } = await authClient.resetPassword(input, { headers });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function logoutMutationOptions() {
  return mutationOptions({
    mutationKey: ["logout"],
    mutationFn: async () => {
      const headers = new Headers();
      headers.set("cookie", (getIncomingHeaders() as any)["cookie"] ?? "");
      const { data, error } = await authClient.signOut(undefined, { headers });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}
