import type { DefaultError, SkipToken } from "@tanstack/query-core";
import {
  isCancelledError,
  queryOptions,
  skipToken,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTypedHandlersErrorFromUnknown,
  retryableTypedHandlersCodes,
  TYPED_HANDLERS_ERROR_CODES_BY_KEY,
  type TypedHandlersError,
} from "./core/errors";
import type { TypedContract } from "./core/typed-contract";
import type { TypedContractFetch } from "./fetch";

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

export function typedQueryOptionsFactory(fetch: TypedContractFetch) {
  return <TC extends TypedContract<any, any, any>>(
    contract: TC,
    input: TC["$infer"]["input"] | SkipToken,
    options?: Partial<
      UseQueryOptions<TC["$infer"]["input"], TypedHandlersError, TC["$infer"]["output"], never>
    >,
  ) => {
    const throwOnError =
      options?.throwOnError ??
      ((error) => {
        console.log("throwOnError");
        console.log(error);
        if (isCancelledError(error)) {
          return false;
        }

        return true;
      });

    return queryOptions<
      TC["$infer"]["output"],
      TypedHandlersError,
      TC["$infer"]["output"],
      [typeof contract.method, ReturnType<typeof contract.url>, typeof input]
    >({
      throwOnError,
      queryKey: [contract.method, contract.url(), input],
      queryFn:
        input === skipToken
          ? skipToken
          : ({ signal }: { signal: AbortSignal }) => {
              if (throwOnError) {
                return fetch(contract, input, { signal });
              }
              return fetch(contract, input, { signal }).catch(() => null);
            },
      retry:
        options?.retry ??
        ((failureCount: any, error: any) => {
          const typedHandlersError = getTypedHandlersErrorFromUnknown(error);
          if (
            typedHandlersError.code &&
            retryableTypedHandlersCodes.includes(
              TYPED_HANDLERS_ERROR_CODES_BY_KEY[typedHandlersError.code],
            )
          ) {
            return failureCount < 2;
          }
          return false;
        }),
      retryDelay:
        options?.retryDelay ??
        ((failureCount: any) => {
          return Math.min(1000 * 2 ** failureCount, 30000) as number;
        }),
      ...options,
    } as any);
  };
}

export function typedMutationOptionsFactory(fetch: TypedContractFetch) {
  return <TC extends TypedContract<any, any, any>>(
    contract: TC,
    options?: UseMutationOptions<
      TC["$infer"]["output"],
      TypedHandlersError,
      TC["$infer"]["input"] | FormData,
      unknown
    >,
  ) => {
    const throwOnError =
      options?.throwOnError ??
      ((error) => {
        if (isCancelledError(error)) {
          return false;
        }

        return true;
      });

    return mutationOptions<
      TC["$infer"]["output"],
      TypedHandlersError,
      TC["$infer"]["input"] | FormData,
      unknown
    >({
      throwOnError,
      mutationKey: [contract.method, contract.url()],
      mutationFn: (input: TC["$infer"]["input"] | FormData) => {
        if (throwOnError) {
          return fetch(contract, input);
        }
        return fetch(contract, input).catch(() => null);
      },
      retry:
        options?.retry ??
        ((failureCount, error) => {
          const typedHandlersError = getTypedHandlersErrorFromUnknown(error);
          if (
            typedHandlersError.code &&
            retryableTypedHandlersCodes.includes(
              TYPED_HANDLERS_ERROR_CODES_BY_KEY[typedHandlersError.code],
            )
          ) {
            return failureCount < 2;
          }
          return false;
        }),
      retryDelay:
        options?.retryDelay ??
        ((failureCount) => {
          return Math.min(1000 * 2 ** failureCount, 30000) as number;
        }),
      ...options,
    });
  };
}
