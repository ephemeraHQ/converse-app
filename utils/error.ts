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

class BaseSDKError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class XMTPError extends BaseSDKError {
  constructor(message: string, cause?: unknown) {
    super(`[XMTP SDK] ${message}`, cause);
  }
}

export class StreamError extends BaseSDKError {
  constructor(message: string, cause?: unknown) {
    super(`[Stream] ${message}`, cause);
  }
}
