import { z } from "zod/v4";
import { getTypedHandlersErrorFromResponse, TypedHandlersError } from "./core/errors";
import { deserializeFormData, serializeFormData } from "./core/form-data";
import { isNonJsonSerializable } from "./core/is-non-json-serializable";
import type { TypedContract } from "./core/typed-contract";

export function typedContractFetchFactory(
  baseUrl: string,
  getDefaultInit?: (contract: TypedContract<any, any, any>) => RequestInit,
) {
  return async <TC extends TypedContract<any, any, any>>(
    contract: TC,
    input: TC["$infer"]["input"],
    overrideInit?: RequestInit,
  ) => {
    const requestData = getRequestData(contract, input);
    const init: RequestInit = {
      ...(getDefaultInit?.(contract) ?? {}),
      ...overrideInit,
      method: contract.methodUppercase,
    };
    let url = `${baseUrl}${contract.url(input)}`;
    if (contract.method === "get") {
      url = requestData ? `${url}?${requestData}` : url;
    } else {
      init.body = requestData;
      if (!(requestData instanceof FormData)) {
        init.headers = { ...init.headers, "Content-Type": "application/json" };
      }
    }
    const res = await fetch(url, init);
    const json = await res.json();
    if (res.status >= 400) {
      throw getTypedHandlersErrorFromResponse(json);
    }
    if (process.env.NODE_ENV === "development") {
      const maybeOutput = contract.outputSchema.safeParse(json);
      if (!maybeOutput.success) {
        throw new TypedHandlersError({
          message: z.prettifyError(maybeOutput.error),
          code: "PARSE_ERROR",
          cause: maybeOutput.error,
        });
      }
      return maybeOutput.data as TC["$infer"]["output"];
    }
    return json as TC["$infer"]["output"];
  };
}

export type TypedContractFetch = ReturnType<typeof typedContractFetchFactory>;

function getRequestData<TC extends TypedContract<any, any, any>>(
  contract: TC,
  unsafeInput: TC["$infer"]["input"] | FormData,
) {
  if (unsafeInput instanceof FormData) {
    const maybeInputData = contract.inputSchema.safeParse(deserializeFormData(unsafeInput));
    if (!maybeInputData.success) {
      throw new TypedHandlersError({
        message: z.prettifyError(maybeInputData.error),
        code: "PARSE_ERROR",
        cause: maybeInputData.error,
      });
    }
    return serializeFormData(maybeInputData.data);
  }

  const maybeInput = contract.inputSchema.safeParse(unsafeInput);
  if (!maybeInput.success) {
    throw new TypedHandlersError({
      message: z.prettifyError(maybeInput.error),
      code: "PARSE_ERROR",
      cause: maybeInput.error,
    });
  }

  if (isNonJsonSerializable(maybeInput.data)) {
    return maybeInput.data as FormData | Blob | File | Uint8Array;
  }

  if (contract.method === "get") {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(maybeInput.data as any)) {
      // skip path params since they are already in the url
      // (no need to include them in the query params)
      if (contract.pathParamKeys.includes(key)) {
        continue;
      }
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          searchParams.append(key, item);
        }
      } else {
        searchParams.append(key, value as any);
      }
    }

    return searchParams.toString();
  }

  return JSON.stringify(
    contract.pathParamKeys.length === 0
      ? maybeInput.data
      : removeObjectKeysInPlace(maybeInput.data as any, contract.pathParamKeys),
  );
}

function removeObjectKeysInPlace<T extends object>(obj: T, keys: (keyof T)[]) {
  for (const key of keys) {
    delete obj[key];
  }
  return obj;
}
