import axios from "axios";

import { getXmtpApiHeaders } from "../components/XmtpState";
import config from "../config";

const api = axios.create({
  baseURL: config.apiURI,
});

export const saveUser = async (address: string) => {
  await api.post("/api/user", { address });
};

export const userExists = async (address: string) => {
  const { data } = await api.get("/api/user/exists", { params: { address } });
  return data.userExists;
};

type ReportMessageQuery = {
  messageId: string;
  messageContent: string;
  messageSender: string;
};

export const reportMessage = async ({
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
    { headers: await getXmtpApiHeaders() }
  );
};

type BlockPeerQuery = {
  peerAddress: string;
  blocked: boolean;
};

export const blockPeer = async ({ peerAddress, blocked }: BlockPeerQuery) => {
  await api.post(
    "/api/block/peer",
    {
      peerAddress,
      blocked,
    },
    { headers: await getXmtpApiHeaders() }
  );
};

export const getBlockedPeers = async () => {
  const { data } = await api.get("/api/block/peer", {
    headers: await getXmtpApiHeaders(),
  });
  return data.blockedPeers as string[];
};

export const resolveEnsName = async (
  name: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/ens", { params: { name } });
  return data.address;
};

type Profile = {
  primaryEns?: string;
};

export const getProfileForAddress = async (
  address: string
): Promise<Profile> => {
  const { data } = await api.get("/api/profile", {
    params: { address },
  });
  return data;
};

export const getProfilesForAddresses = async (
  addresses: string[]
): Promise<{ [address: string]: Profile }> => {
  const { data } = await api.get("/api/profile/batch", {
    params: { addresses },
  });
  return data;
};

type RecommendationTag = {
  text: string;
  image: string;
};

export type RecommendationData = {
  tags: RecommendationTag[];
  ens?: string;
  lensHandles: string[];
  farcasterUsernames: string[];
};

export type Frens = { [address: string]: RecommendationData };

export const findFrens = async () => {
  const headers = await getXmtpApiHeaders();
  const { data } = await api.get("/api/frens/find", {
    // headers: await getXmtpApiHeaders(),
    params: { address: headers["xmtp-api-address"] },
  });

  return data.frens as Frens;
};

export default api;
