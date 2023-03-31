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

export default api;
