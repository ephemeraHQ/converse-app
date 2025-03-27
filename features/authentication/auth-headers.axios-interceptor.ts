import {
  AUTHENTICATE_ROUTE,
  NON_AUTHENTICATED_ROUTES,
} from "@/features/authentication/authentication.constants"
import {
  getConvosAuthenticatedHeaders,
  getConvosAuthenticationHeaders,
} from "@/features/authentication/authentication.headers"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { AuthenticationError } from "../../utils/error"

/**
 * Headers interceptor that handles three types of routes:
 * 1. Authentication route - Requires special authentication headers
 * 2. Non-authenticated routes - No headers needed
 * 3. All other routes - Requires standard authenticated headers
 */
export function setupAxiosAuthHeadersInterceptor() {
  return convosApi.interceptors.request.use(async (config) => {
    const url = config.url

    if (!url) {
      throw new AuthenticationError({
        error: new Error("No URL provided in request config"),
        additionalMessage: "failed to generate headers",
      })
    }

    // Check if this is a non-authenticated route
    const isNonAuthenticatedRoute = NON_AUTHENTICATED_ROUTES.some((route) => url.includes(route))

    // If it's a non-authenticated route, return config without adding headers
    if (isNonAuthenticatedRoute) {
      return config
    }

    // Check if this is the authentication route
    const isAuthenticationRoute = url.includes(AUTHENTICATE_ROUTE)

    try {
      const headers = isAuthenticationRoute
        ? await getConvosAuthenticationHeaders()
        : await getConvosAuthenticatedHeaders()

      Object.entries(headers).forEach(([key, value]) => {
        config.headers.set(key, value)
      })

      return config
    } catch (error) {
      throw new AuthenticationError({
        error,
        additionalMessage: "failed to generate headers",
      })
    }
  })
}
