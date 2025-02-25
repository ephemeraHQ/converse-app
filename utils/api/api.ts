import axios from "axios";
import { apiLogger } from "@/utils/logger";
import { config } from "../../config";
import { headersInterceptor } from "../../features/authentication/interceptor.headers";

export const api = axios.create({
  baseURL: config.apiURI,
});

// Setup request interceptor for attaching appropriate headers
// depending on the route in the request
api.interceptors.request.use(headersInterceptor);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      apiLogger.error(`API Error:`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  },
);
