import axios from "axios";

import config from "../config";
import {
  EnsName,
  FarcasterUsername,
  LensHandle,
  UnstoppableDomain,
} from "../data/store/profilesStore";
import { Frens } from "../data/store/recommendationsStore";
import { getXmtpApiHeaders } from "../utils/xmtpRN/client";

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

export const saveUser = async (address: string) => {
  const now = new Date().getTime();
  const last = lastSaveUser[address] || 0;
  if (now - last < 3000) {
    // Avoid race condition when changing account at same
    // time than coming back on the app.
    return;
  }
  lastSaveUser[address] = now;
  await api.post("/api/user", { address });
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

type BlockPeerQuery = {
  account: string;
  peerAddress: string;
  blocked: boolean;
};

export const blockPeer = async ({
  peerAddress,
  blocked,
  account,
}: BlockPeerQuery) => {
  await api.post(
    "/api/block/peer",
    {
      peerAddress,
      blocked,
    },
    { headers: await getXmtpApiHeaders(account) }
  );
};

export const getBlockedPeers = async (account: string) => {
  const { data } = await api.get("/api/block/peer", {
    headers: await getXmtpApiHeaders(account),
  });
  return data.blockedPeers as string[];
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

type Profile = {
  ensNames?: EnsName[];
  lensHandles?: LensHandle[];
  farcasterUsernames?: FarcasterUsername[];
  unstoppableDomains?: UnstoppableDomain[];
};

export const getProfilesForAddresses = async (
  addresses: string[]
): Promise<{ [address: string]: Profile }> => {
  const { data } = await api.post("/api/profile/batch", {
    addresses,
  });
  return data;
};

export const findFrens = async (account: string) => {
  const { data } = await api.get("/api/frens/find", {
    // headers: await getXmtpApiHeaders(account),
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

export const deleteTopics = async (account: string, topics: string[]) => {
  const topicsStatus: { [key: string]: "deleted" } = {};
  for (const topic of topics) {
    topicsStatus[topic] = "deleted";
  }
  await api.post(
    "/api/topics/status",
    { topicsStatus },
    { headers: await getXmtpApiHeaders(account) }
  );
};

export const consentToTopics = async (account: string, topics: string[]) => {
  const topicsStatus: { [key: string]: "consented" } = {};
  for (const topic of topics) {
    topicsStatus[topic] = "consented";
  }
  await api.post(
    "/api/topics/status",
    { topicsStatus },
    { headers: await getXmtpApiHeaders(account) }
  );
};

export const getTopicsStatus = async (account: string) => {
  const { data } = await api.get("/api/topics/status", {
    headers: await getXmtpApiHeaders(account),
  });
  return data as { [topic: string]: "deleted" | "consented" };
};

export default api;
