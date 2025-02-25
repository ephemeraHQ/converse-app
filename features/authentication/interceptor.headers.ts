import { AxiosRequestConfig } from "axios";
import { AUTHENTICATION_ROUTES } from "@/features/authentication/authentication.constants";
import {
  getConvosAuthenticatedHeaders,
  getConvosAuthenticationHeaders,
} from "@/features/authentication/authentication.headers";
import { apiLogger } from "@/utils/logger";
import { AuthenticationError } from "../../utils/error";

/**
 * These routes are special because they need to be called before we have a JWT.
 * They receive headers that cryptographically prove the user owns the inboxes
 * and wallet they claim to own.
 *
 * The headers include:
 * - App Check token to verify authentic app build
 * - XMTP Installation ID to verify XMTP client
 * - XMTP Inbox ID to identify the user's inbox
 * - XMTP Signature of the app check token to prove ownership of the inbox
 *
 * See authentication.readme.md for more details on the authentication flow
 * and how these headers are used to establish trust before issuing a JWT.
 */
const AuthenticationRoutes = [AUTHENTICATION_ROUTES.AUTHENTICATE] as const;

export const headersInterceptor = async (config: AxiosRequestConfig) => {
  const url = config.url;

  if (!url) {
    throw new AuthenticationError({
      error: new Error("No URL provided in request config"),
      additionalMessage: "failed to generate headers",
    });
  }

  apiLogger.debug(
    `Processing request for URL: ${url}, method: ${config.method}, body: ${JSON.stringify(
      config.data ?? "",
    )}, params: ${JSON.stringify(config.params ?? "")}`,
  );

  const needsAuthenticationHeaders = AuthenticationRoutes.some((route) =>
    url.includes(route),
  );

  let headers;
  try {
    headers = needsAuthenticationHeaders
      ? await getConvosAuthenticationHeaders()
      : await getConvosAuthenticatedHeaders();
  } catch (error) {
    throw new AuthenticationError({
      error,
      additionalMessage: "failed to generate headers",
    });
  }

  config.headers = {
    ...config.headers,
    ...headers,
  };

  return config;
};
