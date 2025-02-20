import { tryGetAppCheckToken } from "../../utils/appCheck";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import {
  getSafeCurrentSender,
  multiInboxStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";
import { toHex } from "viem";
import { ensureJwtQueryData } from "./jwt.query";
import { AuthenticationError } from "@/utils/error";

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

/**
 * Returns the headers required to authenticate with the XMTP API.
 * As of February 18, 2025, these headers are only required for two endpoints:
 * 1. Create User endpoint - Creates a new user account
 * 2. Authenticate endpoint - Creates a new JWT for an existing user
 *
 * Note: We don't use refresh tokens since users are already authenticated via
 * Privy passkeys. See authentication.readme.md for more details.
 */
import { logger } from "@/utils/logger";

export async function getConvosAuthenticationHeaders(): Promise<XmtpApiHeaders> {
  logger.debug(
    "[getConvosAuthenticationHeaders] Starting to get authentication headers"
  );

  const currentEthereumAddress = getSafeCurrentSender().ethereumAddress;
  logger.debug(
    `[getConvosAuthenticationHeaders] Current ethereum address: ${currentEthereumAddress}`
  );

  const areInboxesRestored =
    multiInboxStore.getState().multiInboxClientRestorationState ===
    MultiInboxClientRestorationStates.restored;
  logger.debug(
    `[getConvosAuthenticationHeaders] Are inboxes restored: ${
      multiInboxStore.getState().multiInboxClientRestorationState
    }`
  );
  const appCheckToken = await tryGetAppCheckToken();
  const inboxClient = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: currentEthereumAddress,
  });

  if (!appCheckToken) {
    logger.error(
      "[getConvosAuthenticationHeaders] No App Check Token Available"
    );
    throw new AuthenticationError(
      "No App Check Token Available. This indicates that we believe the app is not running on an authentic build of our application on a device that has not been tampered with."
    );
  }

  if (!areInboxesRestored) {
    logger.error("[getConvosAuthenticationHeaders] Inboxes not restored");
    throw new AuthenticationError(
      "[getConvosAuthenticationHeaders] Inboxes not restored; cannot create headers"
    );
  }

  if (!inboxClient) {
    logger.error(
      "[getConvosAuthenticationHeaders] No inbox client found for account"
    );
    throw new AuthenticationError(
      "[getConvosAuthenticationHeaders] No inbox client found for account"
    );
  }

  logger.debug(
    "[getConvosAuthenticationHeaders] Signing app check token with installation key"
  );
  const rawAppCheckTokenSignature = await inboxClient.signWithInstallationKey(
    appCheckToken
  );
  const appCheckTokenSignatureHexString = toHex(rawAppCheckTokenSignature);

  logger.debug(
    "[getConvosAuthenticationHeaders] Successfully created authentication headers"
  );
  return {
    [XMTP_INSTALLATION_ID_HEADER_KEY]: inboxClient.installationId,
    [XMTP_INBOX_ID_HEADER_KEY]: inboxClient.inboxId,
    [FIREBASE_APP_CHECK_HEADER_KEY]: appCheckToken,
    [XMTP_SIGNATURE_HEADER_KEY]: appCheckTokenSignatureHexString,
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
