import type { DefaultError, UseMutationOptions } from "@tanstack/react-query";

export function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0]?.toLocaleUpperCase())
    .slice(0, 2)
    .join("");
}

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationOptions<TData, TError, TVariables, TContext> {
  return options;
}
