// stolen from tRPC

type KeyFromValue<TValue, TType extends Record<PropertyKey, PropertyKey>> = {
  [K in keyof TType]: TValue extends TType[K] ? K : never;
}[keyof TType];

type InvertKeyValue<TType extends Record<PropertyKey, PropertyKey>> = {
  [TValue in TType[keyof TType]]: KeyFromValue<TValue, TType>;
};

export const TYPED_HANDLERS_ERROR_CODES_BY_KEY = {
  /**
   * Invalid JSON was received by the server.
   * An error occurred on the server while parsing the JSON text.
   */
  PARSE_ERROR: -32000,
  /**
   * The JSON sent is not a valid Request object.
   */
  BAD_REQUEST: -32001, // 400

  // Internal JSON-RPC error
  INTERNAL_SERVER_ERROR: -32002, // 500
  NOT_IMPLEMENTED: -32003, // 501
  BAD_GATEWAY: -32004, // 502
  SERVICE_UNAVAILABLE: -32005, // 503
  GATEWAY_TIMEOUT: -32006, // 504

  // Implementation specific errors
  UNAUTHORIZED: -32007, // 401
  PAYMENT_REQUIRED: -32008, // 402
  FORBIDDEN: -32009, // 403
  NOT_FOUND: -32010, // 404
  METHOD_NOT_SUPPORTED: -32011, // 405
  TIMEOUT: -32012, // 408
  CONFLICT: -32013, // 409
  PRECONDITION_FAILED: -32014, // 412
  PAYLOAD_TOO_LARGE: -32015, // 413
  UNSUPPORTED_MEDIA_TYPE: -32016, // 415
  UNPROCESSABLE_CONTENT: -32017, // 422
  TOO_MANY_REQUESTS: -32018, // 429
  CLIENT_CLOSED_REQUEST: -32019, // 499
} as const;

export const TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY = {
  PARSE_ERROR: 400,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
} satisfies Record<keyof typeof TYPED_HANDLERS_ERROR_CODES_BY_KEY, number>;

export const TYPED_HANDLERS_ERROR_CODES_BY_NUMBER: InvertKeyValue<
  typeof TYPED_HANDLERS_ERROR_CODES_BY_KEY
> = {
  [-32000]: "PARSE_ERROR",
  [-32001]: "BAD_REQUEST",
  [-32002]: "INTERNAL_SERVER_ERROR",
  [-32003]: "NOT_IMPLEMENTED",
  [-32004]: "BAD_GATEWAY",
  [-32005]: "SERVICE_UNAVAILABLE",
  [-32006]: "GATEWAY_TIMEOUT",
  [-32007]: "UNAUTHORIZED",
  [-32008]: "PAYMENT_REQUIRED",
  [-32009]: "FORBIDDEN",
  [-32010]: "NOT_FOUND",
  [-32011]: "METHOD_NOT_SUPPORTED",
  [-32012]: "TIMEOUT",
  [-32013]: "CONFLICT",
  [-32014]: "PRECONDITION_FAILED",
  [-32015]: "PAYLOAD_TOO_LARGE",
  [-32016]: "UNSUPPORTED_MEDIA_TYPE",
  [-32017]: "UNPROCESSABLE_CONTENT",
  [-32018]: "TOO_MANY_REQUESTS",
  [-32019]: "CLIENT_CLOSED_REQUEST",
};

export type TYPED_HANDLERS_ERROR_CODE_NUMBER =
  (typeof TYPED_HANDLERS_ERROR_CODES_BY_KEY)[keyof typeof TYPED_HANDLERS_ERROR_CODES_BY_KEY];
export type TYPED_HANDLERS_ERROR_CODE_KEY = keyof typeof TYPED_HANDLERS_ERROR_CODES_BY_KEY;

export const retryableTypedHandlersCodes: TYPED_HANDLERS_ERROR_CODE_NUMBER[] = [
  TYPED_HANDLERS_ERROR_CODES_BY_KEY.BAD_GATEWAY,
  TYPED_HANDLERS_ERROR_CODES_BY_KEY.SERVICE_UNAVAILABLE,
  TYPED_HANDLERS_ERROR_CODES_BY_KEY.GATEWAY_TIMEOUT,
  TYPED_HANDLERS_ERROR_CODES_BY_KEY.INTERNAL_SERVER_ERROR,
];

class UnknownCauseError extends Error {
  [key: string]: unknown;
}

export function getCauseFromUnknown(cause: unknown): Error | undefined {
  if (cause instanceof Error) {
    return cause;
  }

  const type = typeof cause;
  if (type === "undefined" || type === "function" || cause === null) {
    return undefined;
  }

  // Primitive types just get wrapped in an error
  if (type !== "object") {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return new Error(String(cause));
  }

  // If it's an object, we'll create a synthetic error
  if (Boolean(cause) && !Array.isArray(cause) && typeof cause === "object") {
    return Object.assign(new UnknownCauseError(), cause);
  }

  return undefined;
}

export function getTypedHandlersErrorFromUnknown(cause: unknown): TypedHandlersError {
  if (cause instanceof TypedHandlersError) {
    return cause;
  }
  if (cause instanceof Error && cause.name === "TypedHandlersError") {
    return cause as TypedHandlersError;
  }

  const typedHandlersError = new TypedHandlersError({
    code: "INTERNAL_SERVER_ERROR",
    cause,
  });

  // Inherit stack from error
  if (cause instanceof Error && cause.stack) {
    typedHandlersError.stack = cause.stack;
  }

  return typedHandlersError;
}

export function getTypedHandlersErrorFromResponse(maybeJson: unknown): TypedHandlersError {
  if (maybeJson instanceof TypedHandlersError) {
    return maybeJson;
  }

  if (maybeJson instanceof Error && maybeJson.name === "TypedHandlersError") {
    return maybeJson as TypedHandlersError;
  }

  if (
    typeof maybeJson === "object" &&
    maybeJson !== null &&
    "code" in maybeJson &&
    typeof maybeJson.code === "string" &&
    TYPED_HANDLERS_ERROR_CODES_BY_KEY[
      maybeJson.code as keyof typeof TYPED_HANDLERS_ERROR_CODES_BY_KEY
    ] !== undefined &&
    "message" in maybeJson &&
    typeof maybeJson.message === "string" &&
    "type" in maybeJson &&
    typeof maybeJson.type === "string" &&
    maybeJson.type === "TypedHandlersError"
  ) {
    return new TypedHandlersError({
      message: maybeJson.message,
      code: maybeJson.code as TYPED_HANDLERS_ERROR_CODE_KEY,
      cause: "cause" in maybeJson ? maybeJson.cause : undefined,
    });
  }

  return new TypedHandlersError({
    message: "Unknown error",
    code: "INTERNAL_SERVER_ERROR",
    cause: maybeJson,
  });
}

export class TypedHandlersError extends Error {
  code?: TYPED_HANDLERS_ERROR_CODE_KEY;

  constructor(opts: {
    message?: string;
    code?: TYPED_HANDLERS_ERROR_CODE_KEY;
    cause?: unknown;
  }) {
    const cause = getCauseFromUnknown(opts.cause);
    const message = opts.message ?? cause?.message ?? opts.code;

    super(message, { cause });

    this.code = opts.code;
    this.name = "TypedHandlersError";
    this.cause ??= cause;
  }
}
