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
import {
  clearJwtQueryData,
  ensureJwtQueryData,
  fetchJwtQueryData,
  getJwtQueryData,
  invalidateJwtQueryData,
  setJwtQueryData,
} from "@/features/authentication/jwt.query";
import { getConvosAuthenticatedHeaders } from "@/features/authentication/authentication.headers";
import { AuthenticationError } from "../../utils/error";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export const refreshJwtInterceptor = (
  api: AxiosInstance,
  handleRefreshJwtFailure: () => void
) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    if (!error.response) {
      logger.debug(`[refreshJwtInterceptor] No error response`);
      return Promise.reject(error);
    }

    const isUnauthorizedError = error.response.status === 401;
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    const hasNotTriedTokenRefresh = !originalRequest?._retry;
    logger.debug(
      `[refreshJwtInterceptor] error._retry`,
      originalRequest._retry
    );
    // const hasNotTriedTokenRefresh = true;
    // Only attempt token refresh for 401 errors that haven't been retried
    const shouldRetry =
      isUnauthorizedError && hasNotTriedTokenRefresh && originalRequest;

    if (shouldRetry) {
      logger.debug(`[refreshJwtInterceptor] Attempting to refresh JWT token`);
      // Mark this request as retried to prevent infinite refresh loops
      originalRequest._retry = true;

      try {
        // Step 1: Attempt to get a fresh JWT token
        logger.debug(`[refreshJwtInterceptor] Fetching new JWT token`);
        await invalidateJwtQueryData();
        // setJwtQueryData(undefined);
        // // assert jwt is undefined now
        // const jwt = getJwtQueryData();
        // logger.debug(`[refreshJwtInterceptor] JWT`, !!jwt ? jwt : "undefined");
        // if (jwt) {
        //   throw new Error("JWT is not undefined");
        // }
        const refreshedJwtResponse = await fetchJwtQueryData();
        logger.debug(
          `[refreshJwtInterceptor] Refreshed JWT token: ${JSON.stringify(
            refreshedJwtResponse,
            null,
            2
          )}`
        );
        const isTokenRefreshSuccessful = !!refreshedJwtResponse;

        if (!isTokenRefreshSuccessful) {
          logger.debug(`[refreshJwtInterceptor] Failed to refresh token`);
          throw new AuthenticationError("Failed to refresh token");
        }

        logger.debug(
          `[refreshJwtInterceptor] Successfully refreshed JWT token`
        );

        // Step 2: Get new headers with the fresh token
        logger.debug(`[refreshJwtInterceptor] Getting updated headers`);
        const updatedHeaders = await getConvosAuthenticatedHeaders();

        // Step 3: Update the original request with new headers
        logger.debug(
          `[refreshJwtInterceptor] Updating request with new headers, ${JSON.stringify(
            updatedHeaders,
            null,
            2
          )}`
        );
        const updatedRequest = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            ...updatedHeaders,
          },
        };
        // updatedRequest._retry = false;

        // Step 4: Retry the original request with new token
        logger.debug(`[refreshJwtInterceptor] Retrying original request`);
        return api(updatedRequest);
      } catch (error) {
        logger.error(
          `[refreshJwtInterceptor] Error refreshing token: ${error}`
        );
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
        }`
      );
      logger.debug(`[refreshJwtInterceptor] invoking handleRefreshJwtFailure`);
      handleRefreshJwtFailure();
    }

    return Promise.reject(error);
  };
};
