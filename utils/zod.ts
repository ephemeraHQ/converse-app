import { ZodError } from "zod"

export const ZodValidationError = ZodError

export function isZodValidationError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

export function getFirstZodValidationError(error: ZodError): string {
  return error.issues[0].message
}
