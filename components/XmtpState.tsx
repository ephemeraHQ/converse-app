import { useCallback, useContext, useEffect } from "react";

import {
  getMessagesToSend,
  markMessageAsSent,
  updateMessagesIds,
} from "../data";
import { Message } from "../data/db/entities/message";
import { AppContext, DispatchType } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { getBlockedPeers } from "../utils/api";
import { loadXmtpConversation, loadXmtpKeys } from "../utils/keychain";
import { getXmtpSignature } from "../utils/xmtp";
import { getXmtpClientFromKeys } from "../utils/xmtp/client";
import { parseConversationJSON } from "../utils/xmtp/conversations";
import { Client, Conversation, fromNanoString } from "../vendor/xmtp-js/src";
import { PreparedMessage } from "../vendor/xmtp-js/src/PreparedMessage";
import { isReconnecting } from "./Connecting";

let xmtpClient: Client | null;
let xmtpApiSignature: string | null;

let conversationsByTopic: { [topic: string]: Conversation } = {};
let sendingMessages: { [messageId: string]: boolean } = {};
let sendingPendingMessages = false;

export const resetLocalXmtpState = () => {
  xmtpClient = null;
  xmtpApiSignature = null;
  conversationsByTopic = {};
  sendingMessages = {};
  sendingPendingMessages = false;
};

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

export const sendPreparedMessages = async (
  preparedMessages: {
    [id: string]: PreparedMessage;
  },
  dispatch: DispatchType
) => {
  for (const id in preparedMessages) {
    const preparedMessage = preparedMessages[id];

    try {
      if (
        sendingMessages[id] ||
        !preparedMessage.messageEnvelope.contentTopic
      ) {
        return;
      }
      sendingMessages[id] = true;
      await preparedMessage.send();
      // Here message has been sent, let's mark it as
      // sent locally to make sure we don't sent twice
      await markMessageAsSent(
        id,
        preparedMessage.messageEnvelope.contentTopic,
        dispatch
      );
      delete sendingMessages[id];
    } catch (e: any) {
      console.log("Could not send message, will probably try again later", e);
      delete sendingMessages[id];
    }
  }
};

export const sendPendingMessages = async (dispatch: DispatchType) => {
  if (sendingPendingMessages) {
    return;
  }
  sendingPendingMessages = true;
  try {
    const messagesToSend = await getMessagesToSend();
    if (messagesToSend.length === 0) {
      sendingPendingMessages = false;
      return;
    }
    console.log(`Trying to send ${messagesToSend.length} pending messages...`);
    const preparedMessagesToSend: { [newMessageId: string]: PreparedMessage } =
      {};
    const messageIdsToUpdate: {
      [messageId: string]: {
        newMessageId: string;
        newMessageSent: number;
        message: Message;
      };
    } = {};
    for (const message of messagesToSend) {
      if (sendingMessages[message.id]) {
        continue;
      }
      const conversation = await getLocalXmtpConversationForTopic(
        message.conversationId
      );
      if (conversation) {
        const preparedMessage = await conversation.prepareMessage(
          message.content
        );
        const newMessageId = await preparedMessage.messageID();
        preparedMessagesToSend[newMessageId] = preparedMessage;
        messageIdsToUpdate[message.id] = {
          newMessageId,
          newMessageSent:
            fromNanoString(
              preparedMessage.messageEnvelope.timestampNs
            )?.getTime() || 0,
          message,
        };
      }
    }
    await updateMessagesIds(messageIdsToUpdate, dispatch);
    await sendPreparedMessages(preparedMessagesToSend, dispatch);
  } catch (e) {
    console.log(e);
  }
  sendingPendingMessages = false;
};

export const getLocalXmtpClient = async (
  dispatch?: DispatchType,
  currentAddress?: string
) => {
  if (
    !xmtpClient ||
    (currentAddress && xmtpClient.address !== currentAddress)
  ) {
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

export default function XmtpState() {
  const { dispatch, state } = useContext(AppContext);
  // On open; opening XMTP session
  useEffect(() => {
    const initXmtp = async () => {
      try {
        await getLocalXmtpClient(dispatch, state.xmtp.address);
      } catch (e) {
        console.log(
          "Count not instantiate local XMTP client, retrying in 3 seconds..."
        );
        await new Promise((r) => setTimeout(r, 3000));
        initXmtp();
      }
    };
    initXmtp();
  }, [dispatch, state.xmtp.address]);
  const messageSendingInterval = useCallback(async () => {
    if (
      state.xmtp.localConnected &&
      state.xmtp.webviewConnected &&
      state.app.splashScreenHidden &&
      state.xmtp.initialLoadDone &&
      !isReconnecting
    ) {
      await sendPendingMessages(dispatch);
    }
    await new Promise((r) => setTimeout(r, 1000));
    messageSendingInterval();
  }, [
    dispatch,
    state.app.splashScreenHidden,
    state.xmtp.initialLoadDone,
    state.xmtp.localConnected,
    state.xmtp.webviewConnected,
  ]);
  useEffect(() => {
    messageSendingInterval();
  }, [messageSendingInterval]);
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
