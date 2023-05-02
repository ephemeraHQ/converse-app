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

export enum RecommentationTag {
  SHARED_TRANSACTION = "SHARED_TRANSACTION",
  FOLLOW_EACH_OTHER_ON_LENS = "FOLLOW_EACH_OTHER_ON_LENS",
  FOLLOW_EACH_OTHER_ON_WARPCAST = "FOLLOW_EACH_OTHER_ON_WARPCAST",
  SHARED_NFT_COLLECTION = "SHARED_NFT_COLLECTION",
}

type RecommendationTagWithParams = {
  tag: RecommentationTag;
  params?: { [param: string]: any };
};

export type RecommendationData = {
  tags: RecommendationTagWithParams[];
  ens?: string;
  lensHandles: string[];
  farcasterUsernames: string[];
};

export type Frens = { [address: string]: RecommendationData };

export const findFrens = async () => {
  const { data } = await api.get("/api/frens/find", {
    headers: await getXmtpApiHeaders(),
  });
  console.log({ data });

  return data.frens as Frens;
};

export default api;
