import { AxiosRequestConfig } from "axios";
import {
  getConvosAuthenticationHeaders,
  getConvosAuthenticatedHeaders,
} from "@/features/authentication/authentication.headers";
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
const AuthenticationRoutes = ["/api/v1/users", "/api/v1/authenticate"] as const;

export const headersInterceptor = async (config: AxiosRequestConfig) => {
  const url = config.url;

  if (!url) {
    throw new AuthenticationError("No URL provided in request config");
  }

  const needsAuthenticationHeaders = AuthenticationRoutes.some((route) =>
    url.includes(route)
  );

  const isJwtSetupOnBackend = /** not prioritized for March launch */ false;

  const shouldUseJwtHeaders = isJwtSetupOnBackend && needsAuthenticationHeaders;

  const headers = shouldUseJwtHeaders
    ? await getConvosAuthenticationHeaders()
    : await getConvosAuthenticatedHeaders();

  config.headers = {
    ...config.headers,
    ...headers,
  };

  return config;
};
