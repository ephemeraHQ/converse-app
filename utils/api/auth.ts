import { tryGetAppCheckToken } from "../appCheck";
import logger from "../logger";
import { getSecureMmkvForAccount } from "../mmkv";
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

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type AuthParams = {
  inboxId: string;
  installationPublicKey: string;
  installationKeySignature: string;
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
  installationKeySignature,
  appCheckToken,
  account,
}: AuthParams): Promise<AuthResponse> {
  logger.info("Creating access token");
  const { data } = await dedupedFetch("/api/authenticate" + inboxId, () =>
    api.post<AuthResponse>(
      "/api/authenticate",
      {
        inboxId,
        installationKeySignature,
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
  logger.info("Created access token");
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
      api.post<AuthResponse>("/api/authenticate/token", { token: refreshToken })
  );

  if (!data?.accessToken) {
    throw new Error(`Failed to rotate access token for account ${account}`);
  }

  const secureMmkv = await getSecureMmkvForAccount(account);
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

  const secureMmkv = await getSecureMmkvForAccount(account);
  const appCheckToken = await tryGetAppCheckToken();
  let accessToken = secureMmkv.getString(CONVERSE_ACCESS_TOKEN_STORAGE_KEY);

  if (!appCheckToken) {
    throw new Error(
      "No App Check Token Available. This indicates that we believe the app is not running on an authentic build of our application on a device that has not been tampered with."
    );
  }

  if (!accessToken) {
    const installationKeySignature =
      xmtpSignatureByAccount[account] ||
      (await getInstallationKeySignature(account, XMTP_IDENTITY_KEY));

    // Cache signature for future use
    if (!xmtpSignatureByAccount[account]) {
      xmtpSignatureByAccount[account] = installationKeySignature;
    }

    const inboxId = await getInboxId(account);
    const authTokensResponse = await fetchAccessToken({
      inboxId,
      account,
      appCheckToken,
      ...installationKeySignature,
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
