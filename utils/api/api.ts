import axios from "axios";
import { config } from "../../config";
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
