import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type HTTPExceptionOptions = {
  res?: Response;
  message?: string;
  cause?: unknown;
};

export function isAsyncStatusApiError(
  error: unknown,
): error is AsyncStatusExpectedApiError {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return true;
  }

  return false;
}

export class AsyncStatusUnexpectedApiError extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    super(500, {
      message: "An unexpected error occurred. Please try again later.",
      ...options,
    });
  }
}

export class AsyncStatusExpectedApiError extends HTTPException {
  constructor(status: ContentfulStatusCode, options: HTTPExceptionOptions) {
    super(status, options);
  }
}

export class AsyncStatusBadRequestError extends AsyncStatusExpectedApiError {
  constructor(options: HTTPExceptionOptions) {
    super(400, options);
  }
}

export class AsyncStatusUnauthorizedError extends AsyncStatusExpectedApiError {
  constructor(options: HTTPExceptionOptions) {
    super(401, options);
  }
}

export class AsyncStatusForbiddenError extends AsyncStatusExpectedApiError {
  constructor(options: HTTPExceptionOptions) {
    super(403, options);
  }
}

export class AsyncStatusNotFoundError extends AsyncStatusExpectedApiError {
  constructor(options: HTTPExceptionOptions) {
    super(404, options);
  }
}
