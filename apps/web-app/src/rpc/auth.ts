import { queryOptions } from "@tanstack/react-query";

import { authClient } from "@/lib/auth";
import { mutationOptions } from "@/lib/utils";

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: ["session"],
    queryFn: async ({ signal }) => {
      const { data, error } = await authClient.getSession({
        fetchOptions: { signal },
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
    mutationFn: async (
      input: Parameters<typeof authClient.signIn.email>[0],
    ) => {
      const { data, error } = await authClient.signIn.email(input);
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
    mutationFn: async (
      input: Parameters<typeof authClient.signUp.email>[0],
    ) => {
      const { data, error } = await authClient.signUp.email(input);
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
    mutationFn: async (
      input: Parameters<typeof authClient.forgetPassword>[0],
    ) => {
      const { data, error } = await authClient.forgetPassword(input);
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
    mutationFn: async (
      input: Parameters<typeof authClient.resetPassword>[0],
    ) => {
      const { data, error } = await authClient.resetPassword(input);
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
      const { data, error } = await authClient.signOut();
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}
