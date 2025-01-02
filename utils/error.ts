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
