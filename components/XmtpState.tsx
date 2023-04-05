import { Client, Conversation } from "@xmtp/xmtp-js";
import { PreparedMessage } from "@xmtp/xmtp-js/dist/types/src/PreparedMessage";
import { useContext, useEffect } from "react";

import { AppContext, DispatchType } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { getBlockedPeers } from "../utils/api";
import { loadXmtpConversation, loadXmtpKeys } from "../utils/keychain";
import { getXmtpSignature } from "../utils/xmtp";
import { getXmtpClientFromKeys } from "../utils/xmtp/client";
import { parseConversationJSON } from "../utils/xmtp/conversations";

let xmtpClient: Client | null;
let xmtpApiSignature: string | null;

const conversationsByTopic: { [topic: string]: Conversation } = {};

export const getLocalXmtpConversationForTopic = async (
  topic: string
): Promise<Conversation> => {
  const client = await getLocalXmtpClient();
  if (!client) throw new Error("No XMTP Client");
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
  const conversation = await parseConversationJSON(client, savedConversation);
  conversationsByTopic[topic] = conversation;
  return conversation;
};

export const prepareXmtpMessage = async (topic: string, content: string) => {
  const conversation = await getLocalXmtpConversationForTopic(topic);
  const preparedMessage = await conversation.prepareMessage(content);
  return preparedMessage;
};

const sendingMessages: { [messageId: string]: boolean } = {};

export const sendPreparedMessage = async (preparedMessage: PreparedMessage) => {
  const id = await preparedMessage.messageID();
  try {
    if (sendingMessages[id]) return;
    sendingMessages[id] = true;
    await preparedMessage.send();
    delete sendingMessages[id];
  } catch (e) {
    console.log("An error occured while sending message", e);
    delete sendingMessages[id];
  }
};

const sendMessagesToSend = async () => {
  // const messagesToSend = await getMessagesToSend();
  // for (const message of messagesToSend) {
  //   const conversation = await getLocalXmtpConversationForTopic(
  //     message.conversationId
  //   );
  //   if (conversation) {
  //     const preparedMessage = await getPreparedMessageFromMessage(
  //       message,
  //       conversation
  //     );
  //     await preparedMessage.send();
  //   }
  // }
  // console.log(`${messagesToSend.length} saved messages to send`);
};

export const getLocalXmtpClient = async (dispatch?: DispatchType) => {
  if (!xmtpClient) {
    const keys = await loadXmtpKeys();
    if (keys) {
      const parsedKeys = JSON.parse(keys);
      xmtpClient = await getXmtpClientFromKeys(parsedKeys);
      getXmtpApiHeaders();
    }
  }
  if (xmtpClient && dispatch) {
    dispatch({
      type: XmtpDispatchTypes.XmtpLocalConnected,
      payload: { connected: true },
    });
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
    getLocalXmtpClient(dispatch);
  }, [dispatch, state.xmtp.address]);
  useEffect(() => {
    const messageSendingInterval = setInterval(() => {
      if (
        state.xmtp.localConnected &&
        state.xmtp.webviewConnected &&
        state.app.splashScreenHidden
      ) {
        sendMessagesToSend();
      }
    }, 2000);
    return () => clearInterval(messageSendingInterval);
  }, [
    state.app.splashScreenHidden,
    state.xmtp.localConnected,
    state.xmtp.webviewConnected,
  ]);
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
