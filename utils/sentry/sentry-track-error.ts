import * as Sentry from "@sentry/react-native"

export function sentryTrackError({ error, extras, tags }: ISentryTrackErrorArgs) {
  // Check if we should filter this error
  const errorMessage = error.message || ""
  const shouldFilter = errorsToFilterOut.some((errorStr) => errorMessage.includes(errorStr))

  if (shouldFilter) {
    // logger.debug(`Filtering out error: ${errorMessage}`)
    return
  }

  Sentry.withScope(async (scope) => {
    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    if (tags) {
      scope.setTags(tags)
    }

    Sentry.captureException(error)
  })
}
export type ISentryTrackErrorArgs = {
  error: Error
  tags?: Record<string, string>
  extras?: Record<string, unknown>
} // Error patterns that should not be reported to Sentry
export const errorsToFilterOut = [
  "Request failed with status code 401",
  "Request failed with status code 404",
]
