import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { useEffect } from "react"
import { getConvosAuthenticatedHeaders } from "@/features/authentication/authentication.headers"
import { refreshAndGetNewJwtQuery } from "@/features/authentication/jwt.query"
import { useLogout } from "@/features/authentication/use-logout"
import { captureError } from "@/utils/capture-error"
import { ApiError } from "@/utils/convos-api/convos-api-error"
import { apiLogger } from "@/utils/logger"
import { convosApi } from "../../utils/convos-api/convos-api-instance"
import { AuthenticationError, GenericError } from "../../utils/error"

/**
 * Hook that sets up an axios interceptor to refresh JWT tokens when requests fail with 401
 * Must be used high in the component tree to ensure proper authentication handling
 */
export const useRefreshJwtAxiosInterceptor = () => {
  const { logout } = useLogout()

  useEffect(() => {
    // Create a function that handles JWT refresh failures by logging out the user
    const handleRefreshFailure = async () => {
      apiLogger.debug("[useRefreshJwtAxiosInterceptor] Logging out due to JWT refresh failure")
      try {
        await logout({ caller: "useRefreshJwtAxiosInterceptor" })
      } catch (error) {
        captureError(new AuthenticationError({ error, additionalMessage: "Error logging out" }))
      }
    }

    // Add the response interceptor
    const responseInterceptor = convosApi.interceptors.response.use(
      (response) => response, // Pass through successful responses
      createRefreshTokenInterceptor(convosApi, handleRefreshFailure),
    )

    // Cleanup function removes the interceptor when the component unmounts
    return () => {
      convosApi.interceptors.response.eject(responseInterceptor)
    }
  }, [logout])

  return convosApi
}

// Extended type for tracking retry attempts
type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
}

/**
 * Creates an interceptor function that handles 401 errors by refreshing the JWT token
 * and retrying the original request with the new token
 */
const createRefreshTokenInterceptor = (
  api: AxiosInstance,
  onRefreshFailure: () => Promise<void>,
) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    // If there's no response, we can't handle this error
    if (!error.response) {
      return Promise.reject(error)
    }

    // Only handle 401 Unauthorized errors
    if (error.response.status !== 401) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as ExtendedAxiosRequestConfig
    if (!originalRequest) {
      captureError(
        new ApiError({
          error,
          additionalMessage: "Cannot retry request: original request config is missing",
        }),
      )
      return Promise.reject(error)
    }

    // If we've already tried to refresh the token for this request, don't try again
    // This prevents infinite refresh loops
    if (originalRequest._retry) {
      apiLogger.debug("Token refresh failed: already attempted refresh for this request")
      captureError(
        new ApiError({
          error,
          additionalMessage: "JWT refresh failed: token refresh already attempted",
        }),
      )

      // Logout and reject - we can't recover from this
      await onRefreshFailure()
      return Promise.reject(error)
    }

    try {
      // Mark this request as retried
      originalRequest._retry = true

      // Get a fresh JWT token
      const jwtToken = await refreshAndGetNewJwtQuery()
      if (!jwtToken) {
        throw new AuthenticationError({
          error: new Error("Failed to obtain a new JWT token"),
        })
      }

      // Get headers with the new token
      const updatedHeaders = await getConvosAuthenticatedHeaders()

      // Retry the original request with the new token
      return api({
        ...originalRequest,
        headers: {
          ...originalRequest.headers,
          ...updatedHeaders,
        },
      })
    } catch (refreshError) {
      // If token refresh fails, logout the user and reject the promise
      await onRefreshFailure()
      return Promise.reject(refreshError)
    }
  }
}
