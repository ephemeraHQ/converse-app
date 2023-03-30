import { Client } from "@xmtp/xmtp-js";
import { useEffect } from "react";

import { loadXmtpKeys } from "../utils/keychain";
import { getXmtpClientFromKeys, getXmtpSignature } from "../utils/xmtp";

let xmtpClient: Client | null;
export let xmtpApiSignature: string | null;

export const getLocalXmtpClient = async () => {
  if (xmtpClient) return xmtpClient;
  const keys = await loadXmtpKeys();
  if (keys) {
    const parsedKeys = JSON.parse(keys);
    xmtpClient = await getXmtpClientFromKeys(parsedKeys);
    getXmtpApiSignature();
  }
  return xmtpClient;
};

export const getXmtpApiSignature = async () => {
  if (xmtpApiSignature) return xmtpApiSignature;
  const client = await getLocalXmtpClient();
  if (!client) throw new Error("No XMTP client to generate API signature");
  xmtpApiSignature = await getXmtpSignature(client, "XMTP_IDENTITY");
  return xmtpApiSignature;
};

export const resetLocalXmtpClient = () => {
  xmtpClient = null;
  xmtpApiSignature = null;
};

export default function XmtpState() {
  // On open; opening XMTP session
  useEffect(() => {
    getLocalXmtpClient();
  }, []);
  return null;
}
