export function isError(error: unknown): error is Error {
  return error instanceof Error
}

export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  if (typeof error === "string") {
    return new Error(error)
  }
  // If error is neither an instance of Error nor a string, create a generic error message
  return new Error("Unknown error occurred")
}

export function enhanceError(error: unknown, context: string): Error {
  const originalError = ensureError(error)
  originalError.message = `${context} - ${originalError.message}`
  return originalError
}

export function ensureErrorHandler<T>(handler: (error: Error) => T): (error: unknown) => T {
  return (error: unknown) => handler(ensureError(error))
}

export class UserCancelledError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserCancelledError"
  }
}

type ErrorArgs = {
  error: unknown
  additionalMessage?: string
}

class BaseError extends Error {
  constructor(prefix: string, args: ErrorArgs) {
    const originalError = ensureError(args.error)
    const message = args.additionalMessage
      ? prefix
        ? `${prefix} - ${args.additionalMessage} - ${originalError.message}`
        : `${args.additionalMessage} - ${originalError.message}`
      : prefix
        ? `${prefix} - ${originalError.message}`
        : originalError.message

    super(message)
    this.name = this.constructor.name
    this.cause = args.error
  }
}

export class GenericError extends BaseError {
  constructor(args: ErrorArgs) {
    super("", args)
  }
}

export class HydrationError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[Hydration]", args)
  }
}

export class XMTPError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[XMTP SDK]", args)
  }
}

export class StreamError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[Stream]", args)
  }
}

export class AuthenticationError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[Authentication]", args)
  }
}

export class ApiError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[API]", args)
  }
}

export class ReactQueryError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[React Query]", args)
  }
}

export class FeedbackError extends BaseError {
  constructor(args: ErrorArgs) {
    super("", args)
  }
}

export class PushNotificationError extends BaseError {
  constructor(args: ErrorArgs) {
    super("[Push Notification]", args)
  }
}
