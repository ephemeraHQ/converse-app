import axios from "axios";
import { Platform } from "react-native";

import config from "../config";
import { TopicData } from "../data/store/chatStore";
import { ProfileSocials } from "../data/store/profilesStore";
import { Frens } from "../data/store/recommendationsStore";
import { getXmtpApiHeaders } from "../utils/xmtpRN/api";
import { isDesktop } from "./device";
import { TransferAuthorizationMessage } from "./evm/erc20";
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

export const saveUser = async (address: string, privyAccountId?: string) => {
  const now = new Date().getTime();
  const last = lastSaveUser[address] || 0;
  if (now - last < 3000) {
    // Avoid race condition when changing account at same
    // time than coming back on the app.
    return;
  }
  lastSaveUser[address] = now;

  let platform = undefined as string | undefined;
  if (isDesktop) {
    platform = "macOS";
  } else {
    switch (Platform.OS) {
      case "ios":
        platform = "iOS";
        break;
      case "android":
        platform = "Android";
        break;
      case "web":
        platform = "Web";
        break;

      default:
        break;
    }
  }
  await api.post(
    "/api/user",
    { address, privyAccountId, platform },
    { headers: await getXmtpApiHeaders(address) }
  );
};

export const userExists = async (address: string) => {
  const { data } = await api.get("/api/user/exists", { params: { address } });
  return data.userExists;
};

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

export const resolveUserName = async (
  name: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/username", { params: { name } });
  return data.address;
};

export const resolveEnsName = async (
  name: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/ens", { params: { name } });
  return data.address;
};

export const resolveCbIdName = async (
  name: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/cbid", { params: { name } });
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

export const claimUserName = async (
  username: string,
  userAddress: string
): Promise<string> => {
  const { data } = await api.post(
    "/api/profile/username",
    { username },
    { headers: await getXmtpApiHeaders(userAddress) }
  );
  return data;
};

export const getSendersSpamScores = async (sendersAddresses: string[]) => {
  if (!sendersAddresses || sendersAddresses.length === 0) return {};
  const { data } = await api.post("/api/spam/senders/batch", {
    sendersAddresses: sendersAddresses.filter((s) => !!s),
  });
  return data as { [senderAddress: string]: number };
};

export const getPresignedUriForUpload = async (userAddress: string) => {
  const { data } = await api.get("/api/attachment/presigned", {
    headers: await getXmtpApiHeaders(userAddress),
  });
  return data as { objectKey: string; url: string };
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
  await api.post(
    "/api/subscribe",
    { nativeToken, nativeTokenType, notificationChannel, topicsWithKeys },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
};

export default api;
