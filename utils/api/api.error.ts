import { AxiosError } from "axios";
import { z } from "zod";
import { logger } from "@/utils/logger";

export class ValidationError extends Error {
  constructor(public errors: Record<string, string>) {
    super(Object.values(errors).join(", "));
    this.name = "ValidationError";
  }
}

const errorResponseSchema = z.object({
  success: z.literal(false),
  errors: z.record(z.string()),
});

type IErrorResponse = z.infer<typeof errorResponseSchema>;

export function handleApiError(error: unknown, context: string): never {
  if (error instanceof AxiosError && error.response?.data) {
    const errorData = errorResponseSchema.safeParse(error.response.data);
    if (errorData.success) {
      throw new ValidationError(errorData.data.errors);
    }
    // If parsing failed, log and throw the original error
    logger.error(
      `[${context}] Unexpected error response format: ${JSON.stringify(
        error.response.data
      )}`
    );
  }
  throw error;
}
