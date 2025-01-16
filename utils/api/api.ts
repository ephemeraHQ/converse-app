import axios from "axios";
import config from "../../config";
import { analyticsAppVersion, analyticsPlatform } from "../analytics";
import { setupApiInterceptors } from "./interceptors";

export const api = axios.create({
  baseURL: config.apiURI,
  headers: {
    ConverseUserAgent: `${analyticsPlatform}/${analyticsAppVersion}`,
  },
});

// Setup interceptors
setupApiInterceptors(api);
