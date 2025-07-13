import type { Context, Hono } from "hono";
import { deserializeFormDataObject } from "./core/form-data";
import type { TypedContract, TypedContractMethod } from "./core/typed-contract";
import type { TypedHandler, TypedHandlerCtx } from "./core/typed-handler";
import type { TypedMiddlewareCtx } from "./core/typed-middleware";

type InferEnv<_Hono extends Hono> = _Hono extends Hono<infer Env> ? Env : never;
type InferVars<_Hono extends Hono> = _Hono extends Hono<any, infer Vars> ? Vars : never;

/**
 * Creates a Hono server with typed handlers.
 *
 * @example
 * const app = typedHandlersHonoServer(
 *   new Hono(),
 *   [createUserHandler, getUserHandler],
 *   {
 *     getContext: (ctx) => ({ db: ctx.var.db }),
 *   }
 * );
 */
export function typedHandlersHonoServer<_Hono extends Hono<any, any, any>>(
  hono: _Hono,
  handlers: TypedHandler<any, any>[],
  options: { getContext: (ctx: Context<InferEnv<_Hono>, InferVars<_Hono>>) => object },
) {
  function createRoute(handler: TypedHandler<object, any>) {
    return async (c: Context<InferEnv<_Hono>, InferVars<_Hono>>) => {
      const typedHandlerCtx = options.getContext(c) as TypedHandlerCtx<
        object,
        TypedContract<any, any, any>
      >;
      typedHandlerCtx.input = await getHandlerInput(c);
      typedHandlerCtx.req = c.req.raw;
      typedHandlerCtx.res = c.res;
      typedHandlerCtx.redirect = c.redirect;
      const output = await handler.handle(typedHandlerCtx);
      if (output instanceof Response) {
        return output;
      }
      return c.json(output as any);
    };
  }

  for (const handler of handlers) {
    hono[handler.contract.method as TypedContractMethod](
      handler.contract.url() as any,
      ...handler.middlewares.map((middleware) => {
        return (c: Context<InferEnv<_Hono>, InferVars<_Hono>>, next: () => Promise<void>) => {
          const handlerCtx = options.getContext(c) as TypedMiddlewareCtx<object>;
          handlerCtx.req = c.req.raw;
          handlerCtx.res = c.res;
          handlerCtx.set = c.set;
          return middleware(handlerCtx, next);
        };
      }),
      createRoute(handler),
    );
  }

  return hono;
}

async function getHandlerInput(c: Context) {
  let input: Record<string, unknown> = { ...c.req.param(), ...c.req.query() };
  if (c.req.header("Content-Type") === "application/json") {
    input = { ...input, ...(await c.req.json()) };
  }
  if (c.req.header("Content-Type")?.startsWith("multipart/form-data")) {
    const formData = await c.req.parseBody();
    input = { ...input, ...deserializeFormDataObject(formData) };
  }
  return input;
}
