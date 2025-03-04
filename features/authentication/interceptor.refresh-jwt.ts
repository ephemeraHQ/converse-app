/**
 * Axios response interceptor that handles 401 Unauthorized
 * errors by attempting to refresh the JWT token.
 *
 * When a request fails with 401:
 * 1. Attempts to get a fresh JWT token
 * 2. Updates the original failed request with new auth headers
 * 3. Retries the original request
 * 4. If refresh fails, user is logged out
 */
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { getConvosAuthenticatedHeaders } from "@/features/authentication/authentication.headers"
import { refreshAndGetNewJwtQuery } from "@/features/authentication/jwt.query"
import { captureError } from "@/utils/capture-error"
import { ApiError, AuthenticationError } from "../../utils/error"

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
}

export const refreshJwtInterceptor = (api: AxiosInstance, handleRefreshJwtFailure: () => void) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    if (!error.response) {
      return Promise.reject(error)
    }

    const isUnauthorizedError = error.response.status === 401
    if (!isUnauthorizedError) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as ExtendedAxiosRequestConfig
    if (!originalRequest) {
      captureError(
        new ApiError({
          error,
          additionalMessage: `Skipping refreshing JWT because original request is missing`,
        }),
      )
      return Promise.reject(error)
    }

    const hasTriedTokenRefresh = originalRequest._retry

    // If we already tried refreshing and still got 401,
    // this means our refresh token is invalid/expired
    if (hasTriedTokenRefresh) {
      captureError(
        new ApiError({
          error,
          additionalMessage: `Skipping refreshing JWT because we already tried and failed. Maybe logout?`,
        }),
      )
      // handleRefreshJwtFailure();
      return Promise.reject(error)
    }

    try {
      // Mark this request as retried to prevent infinite refresh loops
      originalRequest._retry = true

      // 1. Attempt to get a fresh JWT token
      const jwtToken = await refreshAndGetNewJwtQuery()

      if (!jwtToken) {
        throw new AuthenticationError({
          error: new Error("Failed to refresh token"),
        })
      }

      // 2. Get new headers with the fresh token
      const updatedHeaders = await getConvosAuthenticatedHeaders()

      // 3. Update and retry the original request with new token
      return api({
        ...originalRequest,
        headers: {
          ...originalRequest.headers,
          ...updatedHeaders,
        },
      })
    } catch (error) {
      handleRefreshJwtFailure()
      return Promise.reject(error)
    }
  }
}
