import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type HTTPExceptionOptions = {
  res?: Response;
  message?: string;
  cause?: unknown;
};

const ASAPIErrorPrefix = "ASAPI";

export type AsyncStatusApiJsonError = {
  type: `${typeof ASAPIErrorPrefix}${string}`;
  message: string;
};

export function isAsyncStatusApiJsonError(
  error: unknown,
): error is AsyncStatusApiJsonError {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    "type" in error &&
    typeof error.type === "string" &&
    error.type.startsWith(ASAPIErrorPrefix)
  ) {
    return true;
  }

  return false;
}

export class AsyncStatusUnexpectedApiError extends HTTPException {
  name = `${ASAPIErrorPrefix}UnexpectedError`;
  constructor(options?: HTTPExceptionOptions) {
    super(500, {
      message: "An unexpected error occurred. Please try again later.",
      ...options,
    });
  }
}

export class AsyncStatusApiError extends HTTPException {
  name = `${ASAPIErrorPrefix}Error`;
  constructor(status: ContentfulStatusCode, options: HTTPExceptionOptions) {
    super(status, options);
  }
}

export class AsyncStatusBadRequestError extends AsyncStatusApiError {
  name = `${ASAPIErrorPrefix}BadRequestError`;
  constructor(options: HTTPExceptionOptions) {
    super(400, options);
  }
}

export class AsyncStatusUnauthorizedError extends AsyncStatusApiError {
  name = `${ASAPIErrorPrefix}UnauthorizedError`;
  constructor(options: HTTPExceptionOptions) {
    super(401, options);
  }
}

export class AsyncStatusForbiddenError extends AsyncStatusApiError {
  name = `${ASAPIErrorPrefix}ForbiddenError`;
  constructor(options: HTTPExceptionOptions) {
    super(403, options);
  }
}

export class AsyncStatusNotFoundError extends AsyncStatusApiError {
  name = `${ASAPIErrorPrefix}NotFoundError`;
  constructor(options: HTTPExceptionOptions) {
    super(404, options);
  }
}
