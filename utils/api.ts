import { TransactionData } from "@components/TransactionPreview/TransactionPreview";
import type { SimulateAssetChangesResponse } from "alchemy-sdk";
import { GroupInvite } from "@utils/api.types";
import axios, { AxiosError } from "axios";
import * as Contacts from "expo-contacts";

import {
  analyticsPlatform,
  analyticsAppVersion,
  analyticsBuildNumber,
} from "./analytics";
import type { TransferAuthorizationMessage } from "./evm/erc20";
import { getPrivyRequestHeaders } from "./evm/privy";
import logger from "./logger";
import type { TransactionDetails } from "./transaction";
import config from "../config";
import type { TopicData } from "../data/store/chatStore";
import type { ProfileSocials } from "../data/store/profilesStore";
import type { Frens } from "../data/store/recommendationsStore";
import type { ProfileType } from "../screens/Onboarding/OnboardingUserProfileScreen";
import type { InboxId } from "@xmtp/react-native-sdk";
import { evmHelpers } from "./evm/helpers";
import {
  getInstallationKeySignature,
  InstallationSignature,
} from "./xmtpRN/client";
import { getInboxId } from "./xmtpRN/signIn";
import { createDedupedFetcher } from "./api.utils";
import { getSecureMmkvForAccount } from "./mmkv";
import {
  CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  FIREBASE_APP_CHECK_HEADER_KEY,
  XMTP_API_ADDRESS_HEADER_KEY,
  XMTP_IDENTITY_KEY,
} from "./api.constants";
import { tryGetAppCheckToken } from "./appCheck";

export const api = axios.create({
  baseURL: config.apiURI,
  headers: {
    ConverseUserAgent: `${analyticsPlatform}/${analyticsAppVersion}`,
  },
});

type PatchedAxiosError = Omit<AxiosError, "config"> & {
  config: AxiosError["config"] & { _retry: boolean };
};

// Better error handling
api.interceptors.response.use(
  function axiosSuccessResponse(response) {
    return response;
  },
  async function axiosErrorResponse(error: PatchedAxiosError) {
    const req = error.config;

    if (error.response) {
      logger.warn(
        `[API] HTTP Error ${error.response.status} - ${error.request._url}`,
        JSON.stringify(
          { headers: error.request._headers, response: error.response.data },
          null,
          2
        )
      );
      const account = req.headers?.[XMTP_API_ADDRESS_HEADER_KEY];
      if (typeof account !== "string") {
        throw new Error("No account in request headers");
      }
      const secureMmkv = await getSecureMmkvForAccount(account);
      const refreshToken = secureMmkv.getString(
        CONVERSE_REFRESH_TOKEN_STORAGE_KEY
      );
      if (
        error.response?.status === 401 &&
        req &&
        // Prevent multiple simultaneous refresh attempts
        !req._retry &&
        // If no refresh token is stored, than token rotation will not be possible
        refreshToken
      ) {
        try {
          const { accessToken } = await rotateAccessToken(
            account,
            refreshToken
          );
          req._retry = true;
          req.headers = {
            ...req.headers,
            authorization: `Bearer ${accessToken}`,
          };

          return api(req);
        } catch (refreshError) {
          // Token rotation failed - this is a legitimate authentication failure
          return Promise.reject(refreshError);
        }
      }
    } else if (error.request) {
      logger.warn(
        `[API] HTTP Error - No response received - ${error.request._url}`,
        error.request
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.warn("Error", error.message);
    }
    return Promise.reject(error);
  }
);

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

export async function fetchAccessToken({
  inboxId,
  installationPublicKey,
  installationKeySignature,
  appCheckToken,
  // TODO: Remove this once we move to InboxId as the account identifier
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
  logger.info(`Rotating access token for account ${account}`);
  if (!refreshToken) {
    throw new Error(
      "Can't request new access token without current token and refresh token"
    );
  }

  const { data } = await dedupedFetch("/api/authenticate/token", () =>
    api.post<AuthResponse>("/api/authenticate/token", { token: refreshToken })
  );

  if (!data) {
    throw new Error(`Could not rotate access token for account ${account}`);
  }
  if (!data.accessToken) {
    throw new Error(
      `No access token in token rotate response for account ${account}`
    );
  }
  logger.info(`Rotated access token for account ${account}`, { data });
  const secureMmkv = await getSecureMmkvForAccount(account);
  secureMmkv.set(CONVERSE_ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
  secureMmkv.set(CONVERSE_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
  return data;
}

export const xmtpSignatureByAccount: {
  [account: string]: InstallationSignature;
} = {};

type XmtpApiHeaders = {
  [XMTP_API_ADDRESS_HEADER_KEY]: string;
  [FIREBASE_APP_CHECK_HEADER_KEY]: string;
  /** Bearer <jwt access token>*/
  authorization: `Bearer ${string}`;
};

export async function getXmtpApiHeaders(
  account: string
): Promise<XmtpApiHeaders> {
  const secureMmkv = await getSecureMmkvForAccount(account);
  let accessToken = secureMmkv.getString(CONVERSE_ACCESS_TOKEN_STORAGE_KEY);

  const appCheckToken = await tryGetAppCheckToken();

  if (!appCheckToken) {
    throw new Error(`
No App Check Token Available. This indicates that we believe the app is not running on an authentic build of
our application on a device that has not been tampered with. 
`);
  }

  logger.info("App Check Token", appCheckToken);

  if (!accessToken) {
    const installationKeySignature =
      xmtpSignatureByAccount[account] ||
      (await getInstallationKeySignature(account, XMTP_IDENTITY_KEY));

    if (!xmtpSignatureByAccount[account]) {
      xmtpSignatureByAccount[account] = installationKeySignature;
    }

    try {
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

      secureMmkv.set(
        CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
        authTokensResponse.accessToken
      );
      secureMmkv.set(
        CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
        authTokensResponse.refreshToken
      );
      accessToken = authTokensResponse.accessToken;
    } catch (error) {
      logger.error("Error while getting access token", error);
    }
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

const lastSaveUser: { [address: string]: number } = {};

export const saveUser = async (address: string, privyAccountId: string) => {
  const now = new Date().getTime();
  const last = lastSaveUser[address] || 0;
  if (now - last < 3000) {
    // Avoid race condition when changing account at same
    // time than coming back on the app.
    return;
  }
  lastSaveUser[address] = now;

  await api.post(
    "/api/user",
    {
      address,
      privyAccountId,
      platform: analyticsPlatform,
      version: analyticsAppVersion,
      build: analyticsBuildNumber,
    },
    { headers: await getXmtpApiHeaders(address) }
  );
};

export const userExists = async (address: string) => {
  const { data } = await api.get("/api/user/exists", { params: { address } });
  return data.userExists;
};

export const getPrivyAuthenticatedUser = async () => {
  const { data } = await api.get("/api/user/privyauth", {
    headers: getPrivyRequestHeaders(),
  });
  return data;
};

// export const getInvite = async (inviteCode: string): Promise<boolean> => {
//   const { data } = await api.get("/api/user/invite", {
//     params: { inviteCode },
//   });
//   if (data.inviteCode !== inviteCode) {
//     throw new Error("Invalid invite code");
//   }
//   return data;
// };

// type ReportMessageQuery = {
//   account: string;
//   messageId: string;
//   messageContent: string;
//   messageSender: string;
// };

// export const reportMessage = async ({
//   account,
//   messageId,
//   messageContent,
//   messageSender,
// }: ReportMessageQuery) => {
//   await api.post(
//     "/api/report",
//     {
//       messageId,
//       messageContent,
//       messageSender,
//     },
//     { headers: await getXmtpApiHeaders(account) }
//   );
// };

export const getPeersStatus = async (account: string) => {
  const { data } = await api.get("/api/consent/peer", {
    headers: await getXmtpApiHeaders(account),
  });
  return data as { [peerAddress: string]: "blocked" | "consented" };
};

export const deletePeersFromDb = async (account: string): Promise<void> => {
  const { data } = await api.delete("/api/consent", {
    headers: await getXmtpApiHeaders(account),
  });
  return data.message;
};

export const resolveEnsName = async (
  name: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/ens", { params: { name } });
  return data.address;
};

export const resolveUnsDomain = async (
  domain: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/uns", { params: { domain } });
  return data.address;
};

export const resolveFarcasterUsername = async (
  username: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/farcaster", {
    params: { username },
  });
  return data.address;
};

export const getProfilesForAddresses = async (
  addresses: string[]
): Promise<{ [address: string]: ProfileSocials }> => {
  const { data } = await api.post("/api/profile/batch", {
    addresses,
  });
  return data;
};

export const getProfilesForInboxIds = async ({
  inboxIds,
}: {
  inboxIds: string[];
}): Promise<{ [inboxId: InboxId]: ProfileSocials[] }> => {
  logger.info("Fetching profiles for inboxIds", inboxIds);
  const { data } = await api.get("/api/inbox/", {
    params: { ids: inboxIds.join(",") },
  });
  return data;
};

export const searchProfiles = async (
  query: string,
  account: string
): Promise<{ [address: string]: ProfileSocials }> => {
  const { data } = await api.get("/api/profile/search", {
    headers: await getXmtpApiHeaders(account),
    params: { query },
  });
  return data;
};

export const findFrens = async (account: string) => {
  const { data } = await api.get("/api/frens/find", {
    headers: await getXmtpApiHeaders(account),
    params: { address: evmHelpers.toChecksumAddress(account) },
  });

  return data.frens as Frens;
};

type DesktopSessionData = {
  sessionId: string;
  publicKey: string;
  otp: string;
};
export const openDesktopSession = async ({
  sessionId,
  publicKey,
  otp,
}: DesktopSessionData) =>
  api.post("/api/connect", { sessionId, publicKey, otp });

export const fetchDesktopSessionXmtpKey = async ({
  sessionId,
  otp,
}: DesktopSessionData): Promise<string | undefined> => {
  const { data } = await api.get("/api/connect/session", {
    params: { sessionId, otp },
  });
  return data?.encryptedXmtpKey;
};

export const markDesktopSessionDone = async ({
  sessionId,
  otp,
}: DesktopSessionData): Promise<string | undefined> =>
  api.delete("/api/connect/session", {
    params: { sessionId, otp },
  });

export const saveTopicsData = async (
  account: string,
  topicsData: {
    [topic: string]: TopicData;
  }
) => {
  await api.post("/api/topics", topicsData, {
    headers: await getXmtpApiHeaders(account),
  });
};

export const getTopicsData = async (account: string) => {
  const { data } = await api.get("/api/topics", {
    headers: await getXmtpApiHeaders(account),
  });
  return data as { [topic: string]: TopicData };
};

export const pinTopics = async (account: string, topics: string[]) => {
  await api.post(
    "/api/topics/pin",
    { topics },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
};

export const unpinTopics = async (account: string, topics: string[]) => {
  await api.delete("/api/topics/pin", {
    data: { topics },
    headers: await getXmtpApiHeaders(account),
  });
};

export const postUSDCTransferAuthorization = async (
  account: string,
  message: TransferAuthorizationMessage,
  signature: string
): Promise<string> => {
  const { data } = await api.post(
    "/api/evm/transferWithAuthorization",
    { message, signature },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data.txHash;
};

export const getTransactionDetails = async (
  account: string,
  networkId: string,
  reference: string
): Promise<TransactionDetails> => {
  const { data } = await api.get("/api/evm/transactionDetails", {
    headers: await getXmtpApiHeaders(account),
    params: { networkId, reference },
  });
  return data;
};

export const getCoinbaseTransactionDetails = async (
  account: string,
  networkId: string,
  sponsoredTxId: string
): Promise<TransactionDetails> => {
  const { data } = await api.get("/api/evm/coinbaseTransactionDetails", {
    headers: await getXmtpApiHeaders(account),
    params: { networkId, sponsoredTxId },
  });
  return data;
};

export const claimProfile = async ({
  account,
  profile,
}: {
  account: string;
  profile: ProfileType;
}): Promise<string> => {
  const { data } = await api.post("/api/profile/username", profile, {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};

export const checkUsernameValid = async (
  address: string,
  username: string
): Promise<string> => {
  const { data } = await api.get("/api/profile/username/valid", {
    params: { address, username },
  });
  return data;
};

export const getSendersSpamScores = async (sendersAddresses: string[]) => {
  if (!sendersAddresses || sendersAddresses.length === 0) return {};
  const { data } = await api.post("/api/spam/senders/batch", {
    sendersAddresses: sendersAddresses.filter((s) => !!s),
  });
  return data as { [senderAddress: string]: number };
};

export const getPresignedUriForUpload = async (
  userAddress: string | undefined,
  contentType?: string | undefined
) => {
  const { data } = await api.get("/api/attachment/presigned", {
    params: { contentType },
    headers: userAddress
      ? await getXmtpApiHeaders(userAddress)
      : getPrivyRequestHeaders(),
  });
  return data as { objectKey: string; url: string };
};

export const getLastNotificationsSubscribeHash = async (
  account: string,
  nativeToken: string
) => {
  const { data } = await api.post(
    "/api/notifications/subscriptionhash",
    { nativeToken },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data?.hash as string | undefined;
};

export const saveNotificationsSubscribe = async (
  account: string,
  nativeToken: string,
  nativeTokenType: string,
  notificationChannel: string | null,
  topicsWithKeys: {
    [topic: string]: {
      status: "PUSH" | "MUTED";
      hmacKeys?: any;
    };
  }
) => {
  const { data } = await api.post(
    "/api/subscribe",
    { nativeToken, nativeTokenType, notificationChannel, topicsWithKeys },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data.subscribeHash as string;
};

export const notifyFarcasterLinked = async () => {
  await api.post(
    "/api/farcaster/linked",
    {},
    {
      headers: getPrivyRequestHeaders(),
    }
  );
};

export const postAddressBook = async (
  account: string,
  data: {
    deviceId: string;
    countryCode: string;
    contacts: Contacts.Contact[];
  }
) => {
  await api.post("/api/addressbook", data, {
    headers: await getXmtpApiHeaders(account),
  });
};

export type GroupLink = { id: string; name: string; description: string };

export const getGroupLink = async (groupLinkId: string) => {
  const { data } = await api.get(`/api/groups/${groupLinkId}`);
  return data as GroupLink;
};

export type JoinGroupLinkResult =
  | {
      status: "SUCCESS";
      topic: string;
      reason: undefined;
    }
  | {
      status: "DENIED";
      reason: string | undefined;
      topic: undefined;
    }
  | { status: "ERROR"; reason: undefined; topic: undefined };

export const joinGroupFromLink = async (
  userAddress: string,
  groupLinkId: string
) => {
  const { data } = await api.post(
    `/api/groups/join`,
    { groupLinkId },
    {
      headers: await getXmtpApiHeaders(userAddress),
    }
  );
  return data as JoinGroupLinkResult;
};

export type CreateGroupInviteResult = Pick<GroupInvite, "id" | "inviteLink">;

// Create a group invite. The invite will be associated with the account used.
export const createGroupInvite = async (
  account: string,
  inputs: {
    groupName: string;
    description?: string;
    imageUrl?: string;
    groupId: string;
  }
): Promise<CreateGroupInviteResult> => {
  const { data } = await api.post("/api/groupInvite", inputs, {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};

// Get a group invite by ID. This method is unauthenticated
export const getGroupInvite = async (
  inviteId: string
): Promise<GroupInvite> => {
  const { data } = await api.get(`/api/groupInvite/${inviteId}`);
  return data;
};

export const deleteGroupInvite = async (
  account: string,
  inviteId: string
): Promise<void> => {
  await api.delete(`/api/groupInvite/${inviteId}`, {
    headers: await getXmtpApiHeaders(account),
  });
};

export type GroupJoinRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "ERROR";

export type GroupJoinRequest = {
  id: string;
  status: GroupJoinRequestStatus;
  invitedByAddress: string;
  groupName: string;
  imageUrl?: string;
  description?: string;
  groupId?: string;
};

// Create a group join request based on an invite ID.
// This will trigger a push notification for the invite creator
export const createGroupJoinRequest = async (
  account: string,
  inviteId: string
): Promise<Pick<GroupJoinRequest, "id">> => {
  const { data } = await api.post(
    "/api/groupJoinRequest",
    { inviteId },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  logger.debug("[API] Group join request created", data);
  return data;
};

export const getGroupJoinRequest = async (
  id: string
): Promise<GroupJoinRequest> => {
  const { data } = await api.get(`/api/groupJoinRequest/${id}`);
  return data;
};

// Update the status of a group join request. The account must match the creator of the INVITE or the request will error
export const updateGroupJoinRequestStatus = async (
  account: string,
  id: string,
  status: GroupJoinRequest["status"]
): Promise<Pick<GroupJoinRequest, "status" | "id">> => {
  const { data } = await api.put(
    `/api/groupJoinRequest/${id}`,
    { status },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data;
};

export type PendingGroupJoinRequest = {
  id: string; // The ID of the join request
  groupInviteLinkId: string; // The ID of the invite link
  requesterAddress: string; // The address of the user requesting to join the group
  status: GroupJoinRequest["status"]; // The status of the join request. Should be pending
};

// Get all pending groupJoinRequests for all invites that the account has created
export const getPendingGroupJoinRequests = async (
  account: string
): Promise<{ joinRequests: PendingGroupJoinRequest[] }> => {
  const { data } = await api.get("/api/groupJoinRequest/pending", {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};

export const simulateTransaction = async (
  account: string,
  from: string,
  chainId: number,
  transaction: TransactionData
) => {
  const { data } = await api.post(
    "/api/transactions/simulate",
    {
      address: from,
      network: `eip155:${chainId}`,
      value: transaction.value
        ? `0x${BigInt(transaction.value).toString(16)}`
        : undefined,
      to: transaction.to,
      data: transaction.data,
    },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data as SimulateAssetChangesResponse;
};

export const putGroupInviteRequest = async ({
  account,
  status,
  joinRequestId,
}: {
  account: string;
  status: string;
  joinRequestId: string;
}): Promise<void> => {
  const { data } = await api.put(
    `/api/groupJoinRequest/${joinRequestId}`,
    { status },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data;
};

export default api;
