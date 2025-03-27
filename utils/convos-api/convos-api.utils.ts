/**
 * Formats a date for API requests
 * Format: ISO 8601 (e.g. "2024-03-14T15:30:00.000Z")
 * Used with Prisma DateTime fields which expect ISO 8601 format
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString()
}
