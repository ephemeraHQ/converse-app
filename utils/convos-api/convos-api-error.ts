import { AxiosError } from "axios"
import { ZodIssue } from "zod"
import { BaseError, BaseErrorArgs } from "@/utils/error"

/**
 * Type guard for ZodIssue arrays
 * Checks for expected properties on the first item
 */
function isZodIssueArray(details: unknown): details is ZodIssue[] {
  return (
    Array.isArray(details) &&
    details.length > 0 &&
    typeof details[0] === "object" &&
    details[0] !== null &&
    "code" in details[0] &&
    "path" in details[0] &&
    "message" in details[0]
  )
}

export class ApiError extends BaseError {
  constructor(args: BaseErrorArgs & { details?: ZodIssue[] | string }) {
    if (args.details) {
      args.extra = {
        ...args.extra,
      }

      if (typeof args.details === "string") {
        args.extra.details = args.details
      } else if (isZodIssueArray(args.details)) {
        args.extra.validationDetails = args.details
      }
    }

    super("[API]", args)
  }

  // /**
  //  * Checks if this error has validation details
  //  */
  // hasValidationErrors(): boolean {
  //   return !!this.getValidationDetails()?.length
  // }

  // /**
  //  * Returns the validation details if present
  //  */
  // getValidationDetails(): ZodIssue[] | undefined {
  //   return this.extra?.validationDetails as ZodIssue[] | undefined
  // }

  // /**
  //  * Returns the string details if present
  //  */
  // getDetails(): string | undefined {
  //   return this.extra?.details as string | undefined
  // }

  // /**
  //  * Groups validation errors by path
  //  */
  // getFormattedValidationErrors(): Record<string, string[]> {
  //   const details = this.getValidationDetails()
  //   if (!details) {
  //     return {}
  //   }

  //   // Group validation errors by path
  //   const errors: Record<string, string[]> = {}

  //   for (const issue of details) {
  //     const path = issue.path.join(".") || "root"
  //     if (!errors[path]) {
  //       errors[path] = []
  //     }
  //     errors[path].push(issue.message)
  //   }

  //   return errors
  // }

  // /**
  //  * Formats the validation errors into a clean, readable string
  //  */
  // formatValidationDetails(): string {
  //   if (!this.hasValidationErrors()) {
  //     return "No validation errors"
  //   }

  //   const errors = this.getFormattedValidationErrors()
  //   return Object.entries(errors)
  //     .map(([path, messages]) => `${path}: ${messages.join(", ")}`)
  //     .join("\n")
  // }
}

export function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    throw new ApiError({
      error,
      additionalMessage: error.response?.data?.error,
      details: error.response?.data?.details,
    })
  }

  throw error
}
