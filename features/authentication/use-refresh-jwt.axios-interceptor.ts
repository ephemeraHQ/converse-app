import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { useEffect } from "react"
import { getConvosAuthenticatedHeaders } from "@/features/authentication/authentication.headers"
import { refreshAndGetNewJwtQuery } from "@/features/authentication/jwt.query"
import { useLogout } from "@/features/authentication/use-logout"
import { captureError } from "@/utils/capture-error"
import { apiLogger } from "@/utils/logger"
import { api } from "../../utils/api/api"
import { ApiError, AuthenticationError } from "../../utils/error"

export const useRefreshJwtAxiosInterceptor = () => {
  const { logout } = useLogout()

  useEffect(() => {
    // Store interceptors so we can remove them later
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      axiosRefreshJwtInterceptor(api, () => {
        apiLogger.debug("[useLogoutOnJwtRefreshError] Logging out")
        // Now we can use hook-based functions here
        logout({ caller: "useLogoutOnJwtRefreshError" })
      }),
    )

    // Cleanup function to remove interceptors when the component unmounts
    // or when logout changes
    return () => {
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [logout]) // Only reconfigure if logout changes

  return api
}

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
}

const axiosRefreshJwtInterceptor = (api: AxiosInstance, handleRefreshJwtFailure: () => void) => {
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
