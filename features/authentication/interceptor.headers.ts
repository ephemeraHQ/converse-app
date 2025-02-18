import { AxiosRequestConfig } from "axios";
import {
  getConvosAuthenticationHeaders,
  getConvosAuthenticatedHeaders,
} from "@/features/authentication/authentication.headers";
import { AuthenticationError } from "../../utils/error";

const AuthenticationRoutes = ["/api/v1/users", "/api/v1/authenticate"] as const;

export const headersInterceptor = async (config: AxiosRequestConfig) => {
  const url = config.url;

  if (!url) {
    throw new AuthenticationError("No URL provided in request config");
  }

  const needsAuthenticationHeaders = AuthenticationRoutes.some((route) =>
    url.includes(route)
  );

  const headers = needsAuthenticationHeaders
    ? await getConvosAuthenticationHeaders()
    : await getConvosAuthenticatedHeaders();

  config.headers = {
    ...config.headers,
    ...headers,
  };

  return config;
};
