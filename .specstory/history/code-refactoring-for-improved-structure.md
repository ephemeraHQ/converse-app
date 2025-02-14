## SpecStory

## Code Refactoring for Improved Structure (1/15/2025, 4:05:42 PM)

_**User**_

can you take those and create separate files to make it cleaner?

---

_**Assistant**_

I'll help break this down into smaller, more focused files. Here's how we can reorganize the code:

1. First, let's create the main API client file:

```typescript:utils/api/client.ts
import axios from "axios";
import { 
  analyticsAppVersion, 
  analyticsPlatform 
} from "../analytics";
import config from "../../config";
import { setupApiInterceptors } from "./interceptors";

export const api = axios.create({
  baseURL: config.apiURI,
  headers: {
    ConverseUserAgent: `${analyticsPlatform}/${analyticsAppVersion}`,
  },
});

// Setup interceptors
setupApiInterceptors(api);

export default api;
```

2. Create an interceptors file:

```typescript:utils/api/interceptors.ts
import { AxiosInstance, AxiosError } from "axios";
import logger from "../logger";
import { rotateAccessToken } from "./auth";
import { 
  XMTP_API_ADDRESS_HEADER_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY 
} from "./constants";
import { getSecureMmkvForAccount } from "../mmkv";

type PatchedAxiosError = Omit<AxiosError, "config"> & {
  config: AxiosError["config"] & { _retry: boolean };
};

export function setupApiInterceptors(api: AxiosInstance) {
  api.interceptors.response.use(
    function axiosSuccessResponse(response) {
      return response;
    },
    async function axiosErrorResponse(error: PatchedAxiosError) {
      // ... existing interceptor logic ...
    }
  );
}
```

3. Create an authentication file:

```typescript:utils/api/auth.ts
import { api } from "./client";
import logger from "../logger";
import { createDedupedFetcher } from "./utils";
import { 
  CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  FIREBASE_APP_CHECK_HEADER_KEY,
  XMTP_API_ADDRESS_HEADER_KEY 
} from "./constants";
import { getSecureMmkvForAccount } from "../mmkv";
import { InstallationSignature } from "../xmtpRN/client";
import { getInboxId } from "../xmtpRN/signIn";
import { tryGetAppCheckToken } from "../appCheck";

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

// ... fetchAccessToken, rotateAccessToken, getXmtpApiHeaders functions ...
```

4. Create a profiles API file:

```typescript:utils/api/profiles.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import type { IProfileSocials } from "@/features/profiles/profile-types";
import type { ProfileType } from "../../screens/Onboarding/OnboardingUserProfileScreen";
import type { InboxId } from "@xmtp/react-native-sdk";

export const getProfilesForAddresses = async (
  addresses: string[]
): Promise<{ [address: string]: IProfileSocials }> => {
  const { data } = await api.post("/api/profile/batch", { addresses });
  return data;
};

// ... other profile-related functions ...
```

5. Create a groups API file:

```typescript:utils/api/groups.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import type { GroupInvite } from "../api.types";
import logger from "../logger";

export type GroupLink = { 
  id: string; 
  name: string; 
  description: string 
};

export type GroupJoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "ERROR";

// ... group-related types and functions ...
```

6. Create a transactions API file:

```typescript:utils/api/transactions.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import type { TransactionData } from "@components/TransactionPreview/TransactionPreview";
import type { SimulateAssetChangesResponse } from "alchemy-sdk";
import type { TransactionDetails } from "../transaction";

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

// ... other transaction-related functions ...
```

This reorganization:
- Separates concerns into logical groupings
- Makes the code more maintainable and easier to navigate
- Reduces file sizes
- Makes it easier to find and modify related functionality
- Follows the principle of single responsibility

You would need to update imports across your application to point to these new locations. Would you like me to continue with any specific section in more detail?

---

_**User**_

always give me the full code of each file 

---

_**Assistant**_

You're right - let me provide the complete code for each file. Let's start with the first three files (I'll provide the others in follow-up messages to keep responses manageable):

1. Main API client:

```typescript:utils/api/client.ts
import axios from "axios";
import { 
  analyticsAppVersion, 
  analyticsPlatform 
} from "../analytics";
import config from "../../config";
import { setupApiInterceptors } from "./interceptors";

export const api = axios.create({
  baseURL: config.apiURI,
  headers: {
    ConverseUserAgent: `${analyticsPlatform}/${analyticsAppVersion}`,
  },
});

// Setup interceptors
setupApiInterceptors(api);

export default api;
```

2. Interceptors:

```typescript:utils/api/interceptors.ts
import { AxiosInstance, AxiosError } from "axios";
import logger from "../logger";
import { rotateAccessToken } from "./auth";
import { 
  XMTP_API_ADDRESS_HEADER_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY 
} from "./constants";
import { getSecureMmkvForAccount } from "../mmkv";

type PatchedAxiosError = Omit<AxiosError, "config"> & {
  config: AxiosError["config"] & { _retry: boolean };
};

export function setupApiInterceptors(api: AxiosInstance) {
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
          !req._retry &&
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
            return Promise.reject(refreshError);
          }
        }
      } else if (error.request) {
        logger.warn(
          `[API] HTTP Error - No response received - ${error.request._url}`,
          error.request
        );
      } else {
        logger.warn("Error", error.message);
      }
      return Promise.reject(error);
    }
  );
}
```

3. Authentication:

```typescript:utils/api/auth.ts
import { api } from "./client";
import logger from "../logger";
import { createDedupedFetcher } from "./utils";
import { 
  CONVERSE_ACCESS_TOKEN_STORAGE_KEY,
  CONVERSE_REFRESH_TOKEN_STORAGE_KEY,
  FIREBASE_APP_CHECK_HEADER_KEY,
  XMTP_API_ADDRESS_HEADER_KEY,
  XMTP_IDENTITY_KEY 
} from "./constants";
import { getSecureMmkvForAccount } from "../mmkv";
import { InstallationSignature, getInstallationKeySignature } from "../xmtpRN/client";
import { getInboxId } from "../xmtpRN/signIn";
import { tryGetAppCheckToken } from "../appCheck";

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
  logger.info(`Rotating access token for account ${account}`);
  if (!refreshToken) {
    throw new Error(
      "Can't request new access token without current token and refresh token"
    );
  }

  const { data } = await dedupedFetch(
    `/api/authenticate/token-${account}`,
    () =>
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
  if (data.refreshToken) {
    secureMmkv.set(CONVERSE_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
  } else {
    logger.warn("No refresh token in token rotate response");
  }
  return data;
}

export async function getXmtpApiHeaders(
  account: string
): Promise<XmtpApiHeaders> {
  if (!account) {
    throw new Error("[getXmtpApiHeaders] No account provided");
  }
  const secureMmkv = await getSecureMmkvForAccount(account);
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
```

Would you like me to continue with the remaining files (profiles, groups, and transactions)?

---

_**User**_

yes

---

_**Assistant**_

Great! Let's continue with the remaining files:

4. Profiles API:

```typescript:utils/api/profiles.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import type { IProfileSocials } from "@/features/profiles/profile-types";
import type { ProfileType } from "../../screens/Onboarding/OnboardingUserProfileScreen";
import type { InboxId } from "@xmtp/react-native-sdk";
import logger from "../logger";
import { getPrivyRequestHeaders } from "../evm/privy";
import { evmHelpers } from "../evm/helpers";
import type { Frens } from "../../data/store/recommendationsStore";

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
}): Promise<{ [inboxId: InboxId]: IProfileSocials[] }> => {
  logger.info("Fetching profiles for inboxIds", inboxIds);
  const { data } = await api.get("/api/inbox/", {
    params: { ids: inboxIds.join(",") },
  });
  return data;
};

export const searchProfiles = async (
  query: string,
  account: string
): Promise<{ [address: string]: IProfileSocials }> => {
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
    headers: await getXmtpApiHeaders(address),
  });
  return data;
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

export const notifyFarcasterLinked = async () => {
  await api.post(
    "/api/farcaster/linked",
    {},
    {
      headers: getPrivyRequestHeaders(),
    }
  );
};
```

5. Groups API:

```typescript:utils/api/groups.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import type { GroupInvite } from "../api.types";
import logger from "../logger";

export type GroupLink = { 
  id: string; 
  name: string; 
  description: string 
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

export type CreateGroupInviteResult = Pick<GroupInvite, "id" | "inviteLink">;

export type GroupJoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "ERROR";

export type GroupJoinRequest = {
  id: string;
  status: GroupJoinRequestStatus;
  invitedByAddress: string;
  groupName: string;
  imageUrl?: string;
  description?: string;
  groupId?: string;
};

export type PendingGroupJoinRequest = {
  id: string;
  groupInviteLinkId: string;
  requesterAddress: string;
  status: GroupJoinRequest["status"];
};

export const getGroupLink = async (groupLinkId: string) => {
  const { data } = await api.get(`/api/groups/${groupLinkId}`);
  return data as GroupLink;
};

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

export const getPendingGroupJoinRequests = async (
  account: string
): Promise<{ joinRequests: PendingGroupJoinRequest[] }> => {
  const { data } = await api.get("/api/groupJoinRequest/pending", {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};
```

6. Transactions API:

```typescript:utils/api/transactions.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import type { TransactionData } from "@components/TransactionPreview/TransactionPreview";
import type { SimulateAssetChangesResponse } from "alchemy-sdk";
import type { TransactionDetails } from "../transaction";
import type { TransferAuthorizationMessage } from "../evm/erc20";

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
```

These files complete the reorganization of the original code. Each file now has a specific focus and responsibility, making the codebase more maintainable and easier to navigate. Would you like me to explain any specific part in more detail?

---

_**User**_

look at the code i think you forgot some functions like saveUser for example

---

_**Assistant**_

You're absolutely right! Let me create a new file for user-related functions that were missed:

```typescript:utils/api/users.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";
import { getPrivyRequestHeaders } from "../evm/privy";
import { analyticsPlatform, analyticsAppVersion, analyticsBuildNumber } from "../analytics";
import * as Contacts from "expo-contacts";
import logger from "../logger";

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

export const getSendersSpamScores = async (sendersAddresses: string[]) => {
  if (!sendersAddresses || sendersAddresses.length === 0) return {};
  const { data } = await api.post("/api/spam/senders/batch", {
    sendersAddresses: sendersAddresses.filter((s) => !!s),
  });
  return data as { [senderAddress: string]: number };
};
```

And let's also create a file for notification-related functions:

```typescript:utils/api/notifications.ts
import { api } from "./client";
import { getXmtpApiHeaders } from "./auth";

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
```

These two new files cover the remaining functions from the original file. The organization is now:
- `users.ts`: User-related operations (save, exists, peers, address book, spam scores)
- `notifications.ts`: Notification subscription and hash management

Would you like me to explain any part of these new files in detail?

---



---

