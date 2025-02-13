import {
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  XMTP_API_ADDRESS_HEADER_KEY,
} from "@/utils/api/api.constants";
import { rotateAccessToken } from "@/utils/api/auth";
import { AxiosError, AxiosInstance } from "axios";
import { getSecureStorageForUser } from "../storage/secure-storage-by-user";

type PatchedAxiosError = Omit<AxiosError, "config"> & {
  config: AxiosError["config"] & { _retry: boolean };
};

/**
 * @deprecated Use whatever new methodology for token exchnage @rygine dictates.
 *
 * @todo: Ry figure it out!
 *
 * @rygine is refactoring the backend to https://github.com/ephemeraHQ/convos-backend
 * and it's going to be awesome.
 *
 * We're doing the migration manually, so use oldApi only until the new Backend support
 * all of the app's required endpoints.
 */
export function oldsSetupApiInterceptors(oldApi: AxiosInstance) {
  oldApi.interceptors.response.use(
    function axiosSuccessResponse(response) {
      return response;
    },
    async function axiosErrorResponse(error: PatchedAxiosError) {
      const { config, response, request } = error;

      if (!response) {
        if (request) {
          error.message = `[API] No response received - ${request._url}`;
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }

      // Enhance the error message with request context
      error.message = `[API] HTTP ${response.status} - ${
        request._url
      } - ${JSON.stringify(
        { headers: request._headers, response: response.data },
        null,
        2
      )}`;

      const account = config.headers?.[XMTP_API_ADDRESS_HEADER_KEY];
      if (typeof account !== "string") {
        return Promise.reject(error);
      }

      // Token refresh logic
      const secureMmkv = await getSecureStorageForUser(account);
      const refreshToken = secureMmkv.getString(
        CONVERSE_REFRESH_TOKEN_STORAGE_KEY
      );

      if (response.status === 401 && !config._retry && refreshToken) {
        const { accessToken } = await rotateAccessToken(account, refreshToken);
        config._retry = true;
        config.headers = {
          ...config.headers,
          authorization: `Bearer ${accessToken}`,
        };
        return oldApi(config);
      }

      return Promise.reject(error);
    }
  );
}
