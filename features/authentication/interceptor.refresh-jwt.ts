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
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { getConvosAuthenticatedHeaders } from "@/features/authentication/authentication.headers";
import {
  ensureJwtQueryData,
  refetchJwtQuery,
} from "@/features/authentication/jwt.query";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";
import { AuthenticationError } from "../../utils/error";

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export const refreshJwtInterceptor = (
  api: AxiosInstance,
  handleRefreshJwtFailure: () => void,
) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const isUnauthorizedError = error.response.status === 401;
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    const hasNotTriedTokenRefresh = !originalRequest?._retry;

    // Only attempt token refresh for 401 errors that haven't been retried
    const shouldRetry = Boolean(
      isUnauthorizedError && hasNotTriedTokenRefresh && originalRequest,
    );

    if (shouldRetry) {
      // Mark this request as retried to prevent infinite refresh loops
      originalRequest._retry = true;

      try {
        // Step 1: Attempt to get a fresh JWT token
        // Need to refetch, removeQuery or invalidateQuery doesn't work
        await refetchJwtQuery();
        const refreshedJwtResponse = await ensureJwtQueryData();

        const isTokenRefreshSuccessful = !!refreshedJwtResponse;

        if (!isTokenRefreshSuccessful) {
          throw new AuthenticationError({
            error: new Error("Failed to refresh token"),
          });
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
        captureError(error);
        // todo logout
        handleRefreshJwtFailure();
        return Promise.reject(error);
      }
    }

    // Add logging to help debug why retry was skipped
    if (isUnauthorizedError) {
      logger.debug(
        `[refreshJwtInterceptor] JWT refresh skipped: ${
          !hasNotTriedTokenRefresh
            ? "already attempted refresh"
            : !originalRequest
              ? "no original request config"
              : "unknown reason"
        }`,
      );
    }

    return Promise.reject(error);
  };
};
