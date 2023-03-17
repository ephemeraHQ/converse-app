import { Client, Conversation } from "@xmtp/xmtp-js";
import { useContext, useEffect } from "react";

import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { getBlockedPeers } from "../utils/api";
import { loadXmtpConversation, loadXmtpKeys } from "../utils/keychain";
import { getXmtpSignature } from "../utils/xmtp";
import { getXmtpClientFromKeys } from "../utils/xmtp/client";
import { parseConversationJSON } from "../utils/xmtp/conversations";

let xmtpClient: Client | null;
let xmtpApiSignature: string | null;

const conversationsByTopic: { [topic: string]: Conversation } = {};

export const isOnXmtp = async (address: string) => {
  if (!xmtpClient) throw new Error("No XMTP Client");

  return xmtpClient.canMessage(address);
};

const getXmtpConversationForTopic = async (
  topic: string
): Promise<Conversation> => {
  if (!xmtpClient) throw new Error("No XMTP Client");
  if (conversationsByTopic[topic]) return conversationsByTopic[topic];
  let tries = 0;
  let savedConversation: string | null = null;
  // Retry mechanism, 10 times in 5 secs max
  while (!savedConversation && tries < 10) {
    savedConversation = await loadXmtpConversation(topic);
    if (!savedConversation) {
      // Let's wait 0.5 sec and retry
      await new Promise((r) => setTimeout(r, 500));
      tries += 1;
    }
  }
  if (!savedConversation) {
    throw new Error(`No conversation found for topic ${topic}`);
  }
  const conversation = await parseConversationJSON(
    xmtpClient,
    savedConversation
  );
  conversationsByTopic[topic] = conversation;
  return conversation;
};

export const sendXmtpMessage = async (topic: string, content: string) => {
  const conversation = await getXmtpConversationForTopic(topic);
  const message = await conversation.send(content);
  return message;
};

export const getLocalXmtpClient = async () => {
  if (xmtpClient) return xmtpClient;
  const keys = await loadXmtpKeys();
  if (keys) {
    const parsedKeys = JSON.parse(keys);
    xmtpClient = await getXmtpClientFromKeys(parsedKeys);
    getXmtpApiHeaders();
  }
  return xmtpClient;
};

export const getXmtpApiHeaders = async () => {
  const client = await getLocalXmtpClient();
  if (!client) throw new Error("No XMTP client to generate API signature");
  if (xmtpApiSignature && client)
    return {
      "xmtp-api-signature": xmtpApiSignature,
      "xmtp-api-address": client.address,
    };
  xmtpApiSignature = await getXmtpSignature(client, "XMTP_IDENTITY");
  return {
    "xmtp-api-signature": xmtpApiSignature,
    "xmtp-api-address": client.address,
  };
};

export const resetLocalXmtpClient = () => {
  xmtpClient = null;
  xmtpApiSignature = null;
};

export default function XmtpState() {
  const { dispatch, state } = useContext(AppContext);
  // On open; opening XMTP session
  useEffect(() => {
    getLocalXmtpClient();
  }, []);
  useEffect(() => {
    if (state.xmtp.localConnected && state.xmtp.webviewConnected) {
      getBlockedPeers()
        .then((addresses) => {
          const blockedPeerAddresses: { [peerAddress: string]: boolean } = {};
          addresses.forEach((peerAddress) => {
            blockedPeerAddresses[peerAddress.toLowerCase()] = true;
          });
          dispatch({
            type: XmtpDispatchTypes.XmtpSetBlockedPeerAddresses,
            payload: { blockedPeerAddresses },
          });
        })
        .catch((e) => {
          console.log("Error while getting blocked peers", e);
        });
    }
  }, [dispatch, state.xmtp.localConnected, state.xmtp.webviewConnected]);
  return null;
}
