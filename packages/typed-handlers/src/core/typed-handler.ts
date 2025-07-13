import { z } from "zod/v4";
import { TypedHandlersError } from "./errors";
import type { TypedContract } from "./typed-contract";
import type { TypedMiddleware } from "./typed-middleware";

export type TypedHandlerCtx<Context, TC extends TypedContract<any, any, any>> = Context & {
  req: Request;
  res: Response;
  redirect: (
    location: string | URL,
    status?: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308,
  ) => Response;
  input: TC["$infer"]["input"];
};

export function typedHandler<Context, TC extends TypedContract<any, any, any>>(
  contract: TC,
  ...handlers: [
    ...TypedMiddleware<Context>[],
    (ctx: TypedHandlerCtx<Context, TC>) => Promise<TC["$infer"]["output"]>,
  ]
) {
  return {
    contract,
    middlewares: handlers.slice(0, handlers.length - 1) as TypedMiddleware<Context>[],
    handle: async (ctx: TypedHandlerCtx<Context, TC>) => {
      const maybeInput = contract.inputSchema.safeParse(ctx.input);
      if (!maybeInput.success) {
        throw new TypedHandlersError({
          message: z.prettifyError(maybeInput.error),
          code: "PARSE_ERROR",
          cause: maybeInput.error,
        });
      }
      const handler = handlers.at(-1);
      ctx.input = maybeInput.data;
      const output = await (
        handler as (ctx: TypedHandlerCtx<Context, TC>) => Promise<TC["$infer"]["output"]>
      )(ctx);
      if (process.env.NODE_ENV === "development") {
        const maybeOutput = contract.outputSchema.safeParse(output);
        if (!maybeOutput.success) {
          throw new TypedHandlersError({
            message: z.prettifyError(maybeOutput.error),
            code: "PARSE_ERROR",
            cause: maybeOutput.error,
          });
        }
        return maybeOutput.data;
      }
      return output as TC["$infer"]["output"];
    },
  };
}

export type TypedHandler<Context, TC extends TypedContract<any, any, any>> = ReturnType<
  typeof typedHandler<Context, TC>
>;
