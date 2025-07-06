import type { z } from "zod/v4";
import { TypedHandlersError } from "./errors";
import { deserializeFormData } from "./form-data";
import { throwOnTypeOnlyAccess } from "./throw-on-type-only-access";

export type TypedContractMethod = "get" | "post" | "put" | "delete" | "patch";
export type TypedContractMethodUppercase = Uppercase<TypedContractMethod>;

export function typedContract<
  Method extends TypedContractMethod,
  InputSchema extends z.ZodType,
  OutputSchema extends z.ZodType,
>(methodAndUrl: `${Method} ${string}`, inputSchema: InputSchema, outputSchema: OutputSchema) {
  type Input = z.input<InputSchema>;
  type Output = z.output<OutputSchema>;
  const [method, url] = methodAndUrl.split(" ");
  if (!method || !url) {
    throw new Error("Invalid method and url");
  }
  const pathParamKeys = url.match(/:(\w+)/g)?.map((match) => match.slice(1)) ?? [];

  return {
    method: method as Method,
    methodUppercase: method.toUpperCase() as TypedContractMethodUppercase,
    /**
     * Returns the url with the path parameters replaced with the values from the input object.
     * If no input is provided, the url is returned as is.
     * @example
     * ```ts
     * const contract = typedContract("get /users/:id", z.object({ id: z.string() }), z.any());
     * contract.url({ id: "123" }); // "/users/123"
     * contract.url(); // "/users/:id"
     * ```
     */
    url: (input?: Input | FormData) => {
      if (!input) {
        return url;
      }
      if (input instanceof FormData) {
        (input as any) = deserializeFormData(input);
      }
      let _url = url;
      for (const key of pathParamKeys) {
        const value = (input as any)[key];
        if (value === undefined) {
          throw new TypedHandlersError({
            message: `Missing required parameter: ${key}`,
            code: "BAD_REQUEST",
          });
        }
        _url = _url.replace(`:${key}`, value);
      }
      return _url;
    },
    pathParamKeys,
    inputSchema,
    outputSchema,
    $infer: throwOnTypeOnlyAccess as unknown as { input: Input; output: Output },
  };
}

export type TypedContract<
  Method extends TypedContractMethod,
  Input extends z.ZodType,
  Output extends z.ZodType,
> = ReturnType<typeof typedContract<Method, Input, Output>>;
