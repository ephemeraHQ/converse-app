import { toHex } from "viem";
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store";
import { AuthenticationError } from "@/utils/error";
import { logger } from "@/utils/logger";
import { getXmtpClientByEthAddress } from "../xmtp/xmtp-client/xmtp-client.service";
import { ensureJwtQueryData } from "./jwt.query";

// used for requests that are creating an authentication token
export const XMTP_INSTALLATION_ID_HEADER_KEY = "X-XMTP-InstallationId";
export const XMTP_INBOX_ID_HEADER_KEY = "X-XMTP-InboxId";
export const FIREBASE_APP_CHECK_HEADER_KEY = "X-Firebase-AppCheck";
export const XMTP_SIGNATURE_HEADER_KEY = "X-XMTP-Signature";

// used for authenticated requests
export const CONVOS_AUTH_TOKEN_HEADER_KEY = "X-Convos-AuthToken";

export type XmtpApiHeaders = {
  [XMTP_INSTALLATION_ID_HEADER_KEY]: string;
  [XMTP_INBOX_ID_HEADER_KEY]: string;
  [FIREBASE_APP_CHECK_HEADER_KEY]: string;
  [XMTP_SIGNATURE_HEADER_KEY]: string;
};

export async function getConvosAuthenticationHeaders(): Promise<XmtpApiHeaders> {
  logger.debug(
    "[getConvosAuthenticationHeaders] Starting to get authentication headers",
  );

  const currentEthereumAddress = getSafeCurrentSender().ethereumAddress;
  logger.debug(
    `[getConvosAuthenticationHeaders] Current ethereum address: ${currentEthereumAddress}`,
  );

  // Disabled for now until we go live and it works with bun
  const appCheckToken = "123";
  // const appCheckToken = await tryGetAppCheckToken();
  // if (!appCheckToken) {
  //   logger.error(
  //     "[getConvosAuthenticationHeaders] No App Check Token Available"
  //   );
  //   throw new AuthenticationError(
  //     "No App Check Token Available. This indicates that we believe the app is not running on an authentic build of our application on a device that has not been tampered with."
  //   );
  // }

  const inboxClient = await getXmtpClientByEthAddress({
    ethereumAddress: currentEthereumAddress,
  });

  if (!inboxClient) {
    throw new AuthenticationError({
      error: new Error(
        "[getConvosAuthenticationHeaders] No inbox client found for account",
      ),
      additionalMessage: "failed to generate headers",
    });
  }

  logger.debug(
    "[getConvosAuthenticationHeaders] Signing app check token with installation key",
  );

  const rawAppCheckTokenSignature =
    await inboxClient.signWithInstallationKey(appCheckToken);
  const appCheckTokenSignatureHexString = toHex(rawAppCheckTokenSignature);

  logger.debug(
    "[getConvosAuthenticationHeaders] Successfully created authentication headers",
  );

  return {
    [XMTP_INSTALLATION_ID_HEADER_KEY]: inboxClient.installationId,
    [XMTP_INBOX_ID_HEADER_KEY]: inboxClient.inboxId,
    [XMTP_SIGNATURE_HEADER_KEY]: appCheckTokenSignatureHexString,
    [FIREBASE_APP_CHECK_HEADER_KEY]: appCheckToken, // Disabled for now until we go live and it works with bun
  };
}

/**
 * Returns the headers required to authenticate with the API.
 * As of February 18, 2025, these headers are only required for two endpoints:
 * 1. Create User endpoint - Creates a new user account
 * 2. Authenticate endpoint - Creates a new JWT for an existing user
 *
 * Note: We don't use refresh tokens since users are already authenticated via
 * Privy passkeys. See authentication.readme.md for more details.
 */
export async function getConvosAuthenticatedHeaders() {
  const jwt = await ensureJwtQueryData();
  return {
    [CONVOS_AUTH_TOKEN_HEADER_KEY]: jwt,
  };
}
