import axios from "axios";
import * as Contacts from "expo-contacts";

import { ProfileType } from "../components/Onboarding/UserProfile";
import config from "../config";
import { TopicData } from "../data/store/chatStore";
import { ProfileSocials } from "../data/store/profilesStore";
import { Frens } from "../data/store/recommendationsStore";
import { getXmtpApiHeaders } from "../utils/xmtpRN/api";
import { analyticsPlatform } from "./analytics";
import { TransferAuthorizationMessage } from "./evm/erc20";
import { getPrivyRequestHeaders } from "./evm/privy";
import { TransactionDetails } from "./transaction";

const api = axios.create({
  baseURL: config.apiURI,
});

// Better error handling
api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response) {
      console.error(
        `[API] HTTP Error ${error.response.status} - ${error.request._url}`,
        JSON.stringify(
          { headers: error.request._headers, response: error.response.data },
          null,
          2
        )
      );
    } else if (error.request) {
      console.error(
        `[API] HTTP Error - No response received - ${error.request._url}`,
        error.request
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message);
    }
    return Promise.reject(error);
  }
);

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
    { address, privyAccountId, platform: analyticsPlatform },
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

type ReportMessageQuery = {
  account: string;
  messageId: string;
  messageContent: string;
  messageSender: string;
};

export const reportMessage = async ({
  account,
  messageId,
  messageContent,
  messageSender,
}: ReportMessageQuery) => {
  await api.post(
    "/api/report",
    {
      messageId,
      messageContent,
      messageSender,
    },
    { headers: await getXmtpApiHeaders(account) }
  );
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
    params: { address: account },
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

export default api;
