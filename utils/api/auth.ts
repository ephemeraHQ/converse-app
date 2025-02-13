import { tryGetAppCheckToken } from "../appCheck";
import logger, { authLogger } from "../logger";
import { getSecureStorageForUser } from "../storage/secure-storage-by-user";
import {
  InstallationSignature,
  getInstallationKeySignature,
} from "../xmtpRN/xmtp-client/xmtp-client-installations";
import { getInboxId } from "../xmtpRN/signIn";
import { api } from "./api";
import {
  CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  FIREBASE_APP_CHECK_HEADER_KEY,
  XMTP_API_ADDRESS_HEADER_KEY,
  XMTP_IDENTITY_KEY,
} from "./api.constants";
import { createDedupedFetcher } from "./api.utils";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type AuthParams = {
  inboxId: string;
  installationPublicKey: string;
  appCheckTokenSignature: string;
  appCheckToken: string;
  account: string;
};

const { fetch: dedupedFetch } = createDedupedFetcher();

export const xmtpSignatureByAccount: {
  [account: string]: InstallationSignature;
} = {};

export type XmtpApiHeaders = {
  [XMTP_API_ADDRESS_HEADER_KEY]: string;
  [FIREBASE_APP_CHECK_HEADER_KEY]: string;
  authorization: `Bearer ${string}`;
};

export async function fetchAccessToken({
  inboxId,
  installationPublicKey,
  appCheckTokenSignature,
  appCheckToken,
  account,
}: AuthParams): Promise<AuthResponse> {
  authLogger.debug(
    `Creating access token for account: ${account} with inboxId: ${inboxId}`
  );
  const { data } = await dedupedFetch("/api/authenticate" + inboxId, () =>
    api.post<AuthResponse>(
      "/api/authenticate",
      {
        inboxId,
        appCheckTokenSignature,
        installationPublicKey,
        appCheckToken,
      },
      {
        headers: {
          [XMTP_API_ADDRESS_HEADER_KEY]: account,
          [FIREBASE_APP_CHECK_HEADER_KEY]: appCheckToken,
        },
      }
    )
  );

  if (!data.accessToken) {
    throw new Error("No access token in auth response");
  }
  if (!data.refreshToken) {
    throw new Error("No refresh token in auth response");
  }
  authLogger.debug(`Successfully created access token for account: ${account}`);
  return data;
}

export async function rotateAccessToken(
  account: string,
  refreshToken: string | undefined
): Promise<AuthResponse> {
  logger.debug(`Rotating access token for account ${account}`);

  if (!refreshToken) {
    throw new Error("Can't request new access token without refresh token");
  }

  const { data } = await dedupedFetch(
    `/api/authenticate/token-${account}`,
    () =>
      api.post<AuthResponse>("/api/authenticate/token", {
        token: refreshToken,
      })
  );

  if (!data?.accessToken) {
    throw new Error(`Failed to rotate access token for account ${account}`);
  }

  const secureMmkv = await getSecureStorageForUser(account);
  secureMmkv.set(CONVERSE_ACCESS_TOKEN_STORAGE_KEY, data.accessToken);

  if (data.refreshToken) {
    secureMmkv.set(CONVERSE_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
  } else {
    logger.warn("No refresh token in token rotate response");
  }

  logger.debug(`Successfully rotated access token for account ${account}`);
  return data;
}

export async function getXmtpApiHeaders(
  account: string
): Promise<XmtpApiHeaders> {
  if (!account) {
    throw new Error("[getXmtpApiHeaders] No account provided");
  }
  const inboxClient = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  if (!inboxClient) {
    throw new Error("[getXmtpApiHeaders] No inbox client found for account");
  }

  const secureMmkv = await getSecureStorageForUser(account);
  const appCheckToken = await tryGetAppCheckToken();
  let accessToken = secureMmkv.getString(CONVERSE_ACCESS_TOKEN_STORAGE_KEY);

  if (!appCheckToken) {
    throw new Error(
      "No App Check Token Available. This indicates that we believe the app is not running on an authentic build of our application on a device that has not been tampered with."
    );
  }

  if (!accessToken) {
    const appCheckTokenSignature =
      xmtpSignatureByAccount[account] ||
      (await getInstallationKeySignature(account, appCheckToken));

    // Cache signature for future use
    if (!xmtpSignatureByAccount[account]) {
      xmtpSignatureByAccount[account] = appCheckTokenSignature;
    }

    const inboxId = await getInboxId(account);
    const authTokensResponse = await fetchAccessToken({
      inboxId,
      account,
      appCheckToken,
      ...appCheckTokenSignature,
    });

    if (!authTokensResponse) {
      throw new Error("Could not create access token");
    }

    // Store tokens and update local access token
    secureMmkv.set(
      CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
      authTokensResponse.accessToken
    );
    secureMmkv.set(
      CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
      authTokensResponse.refreshToken
    );
    accessToken = authTokensResponse.accessToken;
  }

  if (!accessToken) {
    throw new Error("No access token");
  }

  return {
    [XMTP_API_ADDRESS_HEADER_KEY]: account,
    [FIREBASE_APP_CHECK_HEADER_KEY]: appCheckToken,
    authorization: `Bearer ${accessToken}`,
  };
}
