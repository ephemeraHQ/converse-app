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
import {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";
import { ensureJwtQueryData } from "@/features/authentication/jwt.query";
import { getConvosAuthenticatedHeaders } from "@/features/authentication/authentication.headers";
import { AuthenticationError } from "../../utils/error";

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export const refreshJwtInterceptor = (api: AxiosInstance) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const isUnauthorizedError = error.response.status === 401;
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    const hasNotTriedTokenRefresh = !originalRequest?._retry;

    // Only attempt token refresh for 401 errors that haven't been retried
    if (isUnauthorizedError && hasNotTriedTokenRefresh && originalRequest) {
      // Mark this request as retried to prevent infinite refresh loops
      originalRequest._retry = true;

      try {
        // Step 1: Attempt to get a fresh JWT token
        const refreshedJwtResponse = await ensureJwtQueryData();
        const isTokenRefreshSuccessful = !!refreshedJwtResponse;

        if (!isTokenRefreshSuccessful) {
          throw new AuthenticationError("Failed to refresh token");
        }

        // Step 2: Get new headers with the fresh token
        const updatedHeaders = await getConvosAuthenticatedHeaders();

        // Step 3: Update the original request with new headers
        const updatedRequest = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            ...updatedHeaders,
          },
        };

        // Step 4: Retry the original request with new token
        return api(updatedRequest);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  };
};
