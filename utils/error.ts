export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  // If error is neither an instance of Error nor a string, create a generic error message
  return new Error("Unknown error occurred");
}

export function ensureErrorHandler<T>(
  handler: (error: Error) => T
): (error: unknown) => T {
  return (error: unknown) => handler(ensureError(error));
}

export class UserCancelledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserCancelledError";
  }
}

class BaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class GenericError extends BaseError {
  constructor(args: { message: string; cause: unknown }) {
    super(args.message, args.cause);
  }
}

export class HydrationError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(`[Hydration] ${message}`, cause);
  }
}

export class XMTPError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(`[XMTP SDK] ${message}`, cause);
  }
}

export class StreamError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(`[Stream] ${message}`, cause);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(`[Authentication] ${message}`, cause);
  }
}

export class ApiError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(`[API] ${message}`, cause);
  }
}
