import { isEmpty } from "@/utils/objects"

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

export type BaseErrorArgs = {
  error: unknown
  additionalMessage?: string // This could be an "extra" property but since we're using it a lot we prefer to have it as a separate property
  extra?: Record<string, unknown>
}

export class BaseError extends Error {
  extra?: Record<string, unknown>

  constructor(prefix: string, args: BaseErrorArgs) {
    const originalError = ensureError(args.error)

    const message = `${prefix}${args.additionalMessage ? `: ${args.additionalMessage}` : ""} - ${originalError.message}`

    super(message)

    // Preserve the original error name
    this.name = this.constructor.name

    // Preserve the original error
    this.cause = args.error

    // Merge extra data from original error (if it's a BaseError) with any new extra data
    const originalExtra = args.error instanceof BaseError ? args.error.extra : {}
    const hasExtraData = !isEmpty(originalExtra) || !isEmpty(args.extra)

    if (hasExtraData) {
      this.extra = {
        ...originalExtra,
        ...args.extra,
      }
    }
  }

  // /**
  //  * Formats all error information (message, cause, and extra data) into a string
  //  */
  // formatError(): string {
  //   let result = this.message

  //   if (this.extra && Object.keys(this.extra).length > 0) {
  //     result += "\nExtra information:"
  //     for (const [key, value] of Object.entries(this.extra)) {
  //       result += `\n  ${key}: ${JSON.stringify(value)}`
  //     }
  //   }

  //   return result
  // }
}

export class UserCancelledError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[User Cancelled]", args)
  }
}

export class GenericError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("", args)
  }
}

export class HydrationError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Hydration]", args)
  }
}

export class XMTPError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[XMTP]", args)
  }
}

export class StreamError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Stream]", args)
  }
}

export class AuthenticationError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Authentication]", args)
  }
}

export class ReactQueryError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[React Query]", args)
  }
}

export class FeedbackError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("", args)
  }
}

export class NotificationError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Notification]", args)
  }
}

export class ReactQueryPersistError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[React Query Persist]", args)
  }
}

export class NavigationError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Navigation]", args)
  }
}

export class ValidationError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Validation]", args)
  }
}

export class StorageError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Storage]", args)
  }
}

export class ConnectWalletError extends BaseError {
  constructor(args: BaseErrorArgs) {
    super("[Connect Wallet]", args)
  }
}
