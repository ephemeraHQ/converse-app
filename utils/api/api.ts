import axios from "axios";
import { config } from "../../config";
import { analyticsAppVersion, analyticsPlatform } from "../analytics";
import { oldsSetupApiInterceptors } from "./interceptors";
import { getConvosApiHeaders } from "./auth";

export const api = axios.create({
  baseURL: config.apiURI,
});

// Setup request interceptor for XMTP headers
api.interceptors.request.use(async (config) => {
  const xmtpHeaders = await getConvosApiHeaders();
  config.headers = {
    ...config.headers,
    ...xmtpHeaders,
  };
  return config;
});

/**
 * @deprecated Use api instead
 *
 * @rygine is refactoring the backend to https://github.com/ephemeraHQ/convos-backend
 * and it's going to be awesome.
 *
 * We're doing the migration manually, so use oldApi only until the new Backend support
 * all of the app's required endpoints.
 */
export const oldApi = axios.create({
  baseURL: config.deprecatedApiURI,
  headers: {
    ConverseUserAgent: `${analyticsPlatform}/${analyticsAppVersion}`,
  },
});

// Setup interceptors
oldsSetupApiInterceptors(oldApi);
