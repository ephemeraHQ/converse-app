import {
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  XMTP_API_ADDRESS_HEADER_KEY,
} from "@/utils/api/api.constants";
import { rotateAccessToken } from "@/utils/api/auth";
import { AxiosError, AxiosInstance } from "axios";
import { getSecureMmkvForAccount } from "../mmkv";

type PatchedAxiosError = Omit<AxiosError, "config"> & {
  config: AxiosError["config"] & { _retry: boolean };
};

export function setupApiInterceptors(api: AxiosInstance) {
  api.interceptors.response.use(
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
        throw new Error("No account in request headers");
      }

      // Token refresh logic
      const secureMmkv = await getSecureMmkvForAccount(account);
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
        return api(config);
      }

      return Promise.reject(error);
    }
  );
}
