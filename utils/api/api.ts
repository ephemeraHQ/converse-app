import axios from "axios";
import { config } from "../../config";
import { analyticsAppVersion, analyticsPlatform } from "../analytics";
import { oldsSetupApiInterceptors } from "./interceptors";

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
  baseURL: config.apiURI,
  headers: {
    ConverseUserAgent: `${analyticsPlatform}/${analyticsAppVersion}`,
  },
});

// Setup interceptors
oldsSetupApiInterceptors(oldApi);
