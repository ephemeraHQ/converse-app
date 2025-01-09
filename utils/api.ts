import { GroupInvite } from "@utils/api.types";
import axios, { AxiosError } from "axios";

import { analyticsPlatform, analyticsAppVersion } from "./analytics";
import type { TransferAuthorizationMessage } from "./evm/erc20";
import logger from "./logger";
import type { TransactionDetails } from "./transaction";
import config from "../config";
import type { TopicData } from "../data/store/chatStore";
import type { IProfileSocials } from "@/features/profiles/profile-types";
import type { Frens } from "../data/store/recommendationsStore";
import type { ProfileType } from "../screens/Onboarding/OnboardingUserProfileScreen";
import {
  getInstallationKeySignature,
  InstallationSignature,
} from "./xmtpRN/client";
import { createDedupedFetcher } from "./api.utils";
import { getSecureMmkvForInboxId } from "./mmkv";
import {
  CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  FIREBASE_APP_CHECK_HEADER_KEY,
  XMTP_API_INBOX_ID_HEADER_KEY,
  XMTP_IDENTITY_KEY,
} from "./api.constants";
import { tryGetAppCheckToken } from "./appCheck";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import { InboxId } from "@xmtp/react-native-sdk";

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
      const inboxId = req.headers?.[XMTP_API_INBOX_ID_HEADER_KEY];
      if (typeof inboxId !== "string") {
        throw new Error("No inboxId in request headers");
      }
      const secureMmkv = await getSecureMmkvForInboxId({ inboxId });
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
            { inboxId },
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
};

const { fetch: dedupedFetch } = createDedupedFetcher();

export async function fetchAccessToken({
  inboxId,
  installationPublicKey,
  installationKeySignature,
  appCheckToken,
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
          // used to access secure storage in failures. maybe there's another way to do this?
          [XMTP_API_INBOX_ID_HEADER_KEY]: inboxId,
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
  logger.info(`Created access token for inboxId ${inboxId}`);
  return data;
}

export async function rotateAccessToken(
  { inboxId }: { inboxId: string },
  refreshToken: string | undefined
): Promise<AuthResponse> {
  logger.info(`Rotating access token for inboxId ${inboxId}`);
  if (!refreshToken) {
    throw new Error(
      "Can't request new access token without current token and refresh token"
    );
  }

  const { data } = await dedupedFetch(
    `/api/authenticate/token-${inboxId}`,
    () =>
      api.post<AuthResponse>("/api/authenticate/token", { token: refreshToken })
  );

  if (!data) {
    throw new Error(`Could not rotate access token for inboxId ${inboxId}`);
  }
  if (!data.accessToken) {
    throw new Error(
      `No access token in token rotate response for inboxId ${inboxId}`
    );
  }
  logger.info(`Rotated access token for inboxId ${inboxId}`, { data });
  const secureMmkv = await getSecureMmkvForInboxId({ inboxId });
  secureMmkv.set(CONVERSE_ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
  secureMmkv.set(CONVERSE_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
  return data;
}

const xmtpSignatureByInboxId: {
  [inboxId: string]: InstallationSignature;
} = {};

type XmtpApiHeaders = {
  [XMTP_API_INBOX_ID_HEADER_KEY]: string;
  [FIREBASE_APP_CHECK_HEADER_KEY]: string;
  /** Bearer <jwt access token>*/
  authorization: `Bearer ${string}`;
};

export async function getXmtpApiHeaders({
  inboxId,
}: {
  inboxId: string;
}): Promise<XmtpApiHeaders> {
  if (!inboxId) {
    throw new Error("[getXmtpApiHeaders] No inboxId provided");
  }
  const secureMmkv = await getSecureMmkvForInboxId({ inboxId });
  let accessToken = secureMmkv.getString(CONVERSE_ACCESS_TOKEN_STORAGE_KEY);

  const appCheckToken = await tryGetAppCheckToken();

  if (!appCheckToken) {
    throw new Error(`
No App Check Token Available. This indicates that we believe the app is not running on an authentic build of
our application on a device that has not been tampered with. 
`);
  }

  if (!accessToken) {
    const installationKeySignature =
      xmtpSignatureByInboxId[inboxId] ||
      (await getInstallationKeySignature({
        inboxId,
        messageToSign: XMTP_IDENTITY_KEY,
      }));

    if (!xmtpSignatureByInboxId[inboxId]) {
      xmtpSignatureByInboxId[inboxId] = installationKeySignature;
    }

    try {
      const authTokensResponse = await fetchAccessToken({
        inboxId,
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
    throw new Error(`No access token for inboxId ${inboxId}`);
  }

  return {
    [XMTP_API_INBOX_ID_HEADER_KEY]: inboxId,
    [FIREBASE_APP_CHECK_HEADER_KEY]: appCheckToken,
    authorization: `Bearer ${accessToken}`,
  };
}

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
): Promise<{ [address: string]: IProfileSocials }> => {
  const { data } = await api.post("/api/profile/batch", {
    addresses,
  });
  return data;
};

export const getProfilesForInboxIds = async ({
  inboxIds,
}: {
  inboxIds: string[];
}): Promise<{
  [inboxId: string]: /*todo(lustig) confirm this type*/ IProfileSocials;
}> => {
  logger.info("Fetching profiles for inboxIds", inboxIds);
  const { data } = await api.get("/api/inbox/", {
    params: { ids: inboxIds.join(",") },
    // todo(lustig) fix this request. it is 401ing after ephemeral account creation.
    // why I'm delaying - its tied up in a batshit fetcher
    // thing and I'll have to look into how that ties together with react-query and can't
    // be bothered right now.
    // headers: await getXmtpApiHeaders(account),
  });
  return data;
};

export const searchXmtpProfilesByRawStringForCurrentAccount = async ({
  query,
}: {
  query: string;
}): Promise<{
  /** @todo(lustig) confirm this type */ [inboxId: string]: IProfileSocials;
}> => {
  const currentInboxId = getCurrentInboxId();
  if (!currentInboxId) {
    throw new Error(
      "[searchXmtpProfilesByRawStringForCurrentAccount] No inboxId provided"
    );
  }
  const { data } = await api.get("/api/profile/search", {
    headers: await getXmtpApiHeaders({ inboxId: currentInboxId }),
    params: { query },
  });

  return data;
};

export const findFrensByInboxId = async ({
  accountInboxId,
}: {
  accountInboxId: string;
}) => {
  const { data } = await api.get("/api/frens/find", {
    headers: await getXmtpApiHeaders({ inboxId: accountInboxId }),
    params: { inboxId: accountInboxId },
  });

  return data.frens as Frens;
};

export const saveTopicsData = async ({
  inboxId,
  topicsData,
}: {
  inboxId: InboxId;
  topicsData: {
    [topic: string]: TopicData;
  };
}) => {
  if (!inboxId) {
    throw new Error("[saveTopicsData] No inboxId provided");
  }
  await api.post("/api/topics", topicsData, {
    headers: await getXmtpApiHeaders({ inboxId }),
  });
};

export const getTopicsData = async ({ inboxId }: { inboxId: string }) => {
  const { data } = await api.get("/api/topics", {
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data as { [topic: string]: TopicData };
};

export const pinTopics = async ({
  inboxId,
  topics,
}: {
  inboxId: string;
  topics: string[];
}) => {
  await api.post(
    "/api/topics/pin",
    { topics },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
    }
  );
};

export const unpinTopics = async ({
  inboxId,
  topics,
}: {
  inboxId: string;
  topics: string[];
}) => {
  await api.delete("/api/topics/pin", {
    data: { topics },
    headers: await getXmtpApiHeaders({ inboxId }),
  });
};

export const postUSDCTransferAuthorization = async (
  { inboxId }: { inboxId: string },
  message: TransferAuthorizationMessage,
  signature: string
): Promise<string> => {
  const { data } = await api.post(
    "/api/evm/transferWithAuthorization",
    { message, signature },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
    }
  );
  return data.txHash;
};

export const getTransactionDetails = async ({
  inboxId,
  networkId,
  reference,
}: {
  inboxId: string;
  networkId: string;
  reference: string;
}): Promise<TransactionDetails> => {
  const { data } = await api.get("/api/evm/transactionDetails", {
    headers: await getXmtpApiHeaders({ inboxId }),
    params: { networkId, reference },
  });
  return data;
};

export const getCoinbaseTransactionDetails = async ({
  inboxId,
  networkId,
  sponsoredTxId,
}: {
  inboxId: string;
  networkId: string;
  sponsoredTxId: string;
}): Promise<TransactionDetails> => {
  const { data } = await api.get("/api/evm/coinbaseTransactionDetails", {
    headers: await getXmtpApiHeaders({ inboxId }),
    params: { networkId, sponsoredTxId },
  });
  return data;
};

export const claimProfile = async ({
  inboxId,
  profile,
}: {
  inboxId: string;
  profile: ProfileType;
}): Promise<string> => {
  const { data } = await api.post("/api/profile/username", profile, {
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data;
};

export const checkUsernameValid = async ({
  inboxId,
  address,
  username,
}: {
  inboxId: string;
  address: string;
  username: string;
}): Promise<string> => {
  const { data } = await api.get("/api/profile/username/valid", {
    params: { username, address },
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data;
};

export const getSendersSpamScores = async (senderInboxIds: string[]) => {
  if (!senderInboxIds || senderInboxIds.length === 0) return {};
  const { data } = await api.post("/api/spam/senders/batch", {
    sendersAddresses: senderInboxIds.filter((s) => !!s),
  });
  return data as { [senderAddress: string]: number };
};

export const getPresignedUriForUpload = async ({
  inboxId,
  contentType,
}: {
  inboxId: InboxId;
  contentType: string;
}) => {
  const { data } = await api.get("/api/attachment/presigned", {
    params: { contentType },
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data as { objectKey: string; url: string };
};

export const getLastNotificationsSubscribeHash = async ({
  inboxId,
  nativeToken,
}: {
  inboxId: string;
  nativeToken: string;
}) => {
  const { data } = await api.post(
    "/api/notifications/subscriptionhash",
    { nativeToken },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
    }
  );
  return data?.hash as string | undefined;
};

export const saveNotificationsSubscribe = async ({
  inboxId,
  nativeToken,
  nativeTokenType,
  notificationChannel,
  topicsWithKeys,
}: {
  inboxId: string;
  nativeToken: string;
  nativeTokenType: string;
  notificationChannel: string | null;
  topicsWithKeys: {
    [topic: string]: {
      status: "PUSH" | "MUTED";
      hmacKeys?: any;
    };
  };
}) => {
  const { data } = await api.post(
    "/api/subscribe",
    { nativeToken, nativeTokenType, notificationChannel, topicsWithKeys },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
    }
  );
  return data.subscribeHash as string;
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

export const joinGroupFromLink = async ({
  inboxId,
  groupLinkId,
}: {
  inboxId: string;
  groupLinkId: string;
}) => {
  const { data } = await api.post(
    `/api/groups/join`,
    { groupLinkId },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
    }
  );
  return data as JoinGroupLinkResult;
};

export type CreateGroupInviteResult = Pick<GroupInvite, "id" | "inviteLink">;

// Create a group invite. The invite will be associated with the account used.
export const createGroupInvite = async ({
  inboxId,
  inputs,
}: {
  inboxId: InboxId;
  inputs: {
    groupName: string;
    description?: string;
    imageUrl?: string;
    groupId: string;
  };
}): Promise<CreateGroupInviteResult> => {
  if (!inboxId) {
    throw new Error("[createGroupInvite] Inbox ID is required");
  }
  const { data } = await api.post("/api/groupInvite", inputs, {
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data;
};

// Get a group invite by ID. This method is unauthenticated
export const getGroupInvite = async ({
  inboxId,
  inviteId,
}: {
  inboxId: string;
  inviteId: string;
}): Promise<GroupInvite> => {
  const { data } = await api.get(`/api/groupInvite/${inviteId}`, {
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data;
};

export const deleteGroupInvite = async ({
  inboxId,
  inviteId,
}: {
  inboxId: InboxId;
  inviteId: string;
}): Promise<void> => {
  if (!inboxId) {
    throw new Error("[deleteGroupInvite] Inbox ID is required");
  }
  await api.delete(`/api/groupInvite/${inviteId}`, {
    headers: await getXmtpApiHeaders({ inboxId }),
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
export const createGroupJoinRequest = async ({
  inboxId,
  inviteId,
}: {
  inboxId: string;
  inviteId: string;
}): Promise<Pick<GroupJoinRequest, "id">> => {
  const { data } = await api.post(
    "/api/groupJoinRequest",
    { inviteId },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
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
export const updateGroupJoinRequestStatus = async ({
  inboxId,
  groupJoinRequestId,
  status,
}: {
  inboxId: string;
  groupJoinRequestId: string;
  status: GroupJoinRequest["status"];
}): Promise<Pick<GroupJoinRequest, "status" | "id">> => {
  const { data } = await api.put(
    `/api/groupJoinRequest/${groupJoinRequestId}`,
    { status },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
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
export const getPendingGroupJoinRequests = async ({
  inboxId,
}: {
  inboxId: string;
}): Promise<{ joinRequests: PendingGroupJoinRequest[] }> => {
  const { data } = await api.get("/api/groupJoinRequest/pending", {
    headers: await getXmtpApiHeaders({ inboxId }),
  });
  return data;
};

export const simulateTransaction = async (
  {
    // currentSignerAddress,
    // inboxId,
    // chainId,
    // transaction,
  }: {
    // inboxId: InboxId;
    // currentSignerAddress: string;
    // chainId: number;
    // transaction: TransactionData;
  }
) => {
  throw new Error("Not implemented");
  // const { data } = await api.post(
  //   "/api/transactions/simulate",
  //   {
  //     address: currentSignerAddress,
  //     to: transaction.to,
  //     value: transaction.value
  //       ? `0x${BigInt(transaction.value).toString(16)}`
  //       : undefined,

  //     data: transaction.data,
  //     network: `eip155:${chainId}`,
  //   },
  //   {
  //     headers: await getXmtpApiHeaders({ inboxId }),
  //   }
  // );
  // return data as SimulateAssetChangesResponse;
};

export const putGroupJoinRequest = async ({
  inboxId,
  status,
  joinRequestId,
}: {
  inboxId: InboxId;
  status: string;
  joinRequestId: string;
}): Promise<void> => {
  const { data } = await api.put(
    `/api/groupJoinRequest/${joinRequestId}`,
    { status },
    {
      headers: await getXmtpApiHeaders({ inboxId }),
    }
  );
  return data;
};

export default api;
