export type TypedMiddlewareCtx<Context> = Context & {
  req: Request;
  res: Response;
  set: (key: string, value: unknown) => void;
};

export function typedMiddleware<Context>(
  middleware: (c: TypedMiddlewareCtx<Context>, next: () => Promise<void>) => Promise<void>,
) {
  return async (c: TypedMiddlewareCtx<Context>, next: () => Promise<void>) => {
    await middleware(c, next);
  };
}

export type TypedMiddleware<Context> = ReturnType<typeof typedMiddleware<Context>>;
