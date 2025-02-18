import axios from "axios";
import { config } from "../../config";
import { headersInterceptor } from "../../features/authentication/interceptor.headers";
import { refreshJwtInterceptor } from "../../features/authentication/interceptor.refreshJwt";

/**
 * These routes are special because they need to be called before we have a JWT.
 * They receive headers that cryptographically prove the user owns the inboxes
 * and wallet they claim to own.
 *
 * The headers include:
 * - App Check token to verify authentic app build
 * - XMTP Installation ID to verify XMTP client
 * - XMTP Inbox ID to identify the user's inbox
 * - XMTP Signature to prove ownership
 *
 * See authentication.readme.md for more details on the authentication flow
 * and how these headers are used to establish trust before issuing a JWT.
 */

export const api = axios.create({
  baseURL: config.apiURI,
});

// Setup request interceptor for attaching appropriate headers
// depending on the route in the request
api.interceptors.request.use(headersInterceptor);

// Setup response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  refreshJwtInterceptor(api)
);
