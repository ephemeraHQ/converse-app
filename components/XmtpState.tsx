import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { useEffect, useRef } from "react";

import { Message } from "../data/db/entities/messageEntity";
import { getPendingConversationsToCreate } from "../data/helpers/conversations/pendingConversations";
import {
  getMessagesToSend,
  markMessageAsSent,
  updateMessagesIds,
} from "../data/helpers/messages";
import {
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getBlockedPeers } from "../utils/api";
import { deserializeRemoteAttachmentContent } from "../utils/attachment";
import { loadXmtpConversation, loadXmtpKeys } from "../utils/keychain";
import { pick } from "../utils/objects";
import { getXmtpSignature } from "../utils/xmtp";
import { getXmtpClientFromKeys } from "../utils/xmtp/client";
import {
  createConversation,
  parseConversationJSON,
} from "../utils/xmtp/conversations";
import { Client, Conversation, fromNanoString } from "../vendor/xmtp-js/src";
import { PreparedMessage } from "../vendor/xmtp-js/src/PreparedMessage";

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

export const sendPreparedMessages = async (
  preparedMessages: Map<string, PreparedMessage>
) => {
  for (const id of preparedMessages.keys()) {
    const preparedMessage = preparedMessages.get(id);
    if (!preparedMessage) continue;
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
      await markMessageAsSent(id, preparedMessage.messageEnvelope.contentTopic);
      delete sendingMessages[id];
    } catch (e: any) {
      console.log("Could not send message, will probably try again later", e);
      delete sendingMessages[id];
    }
  }
};

export const createPendingConversations = async () => {
  const pendingConvos = await getPendingConversationsToCreate();
  if (pendingConvos.length === 0) return;
  console.log(
    `Trying to create ${pendingConvos.length} pending conversations...`
  );
  await Promise.all(pendingConvos.map(createConversation));
};

export const sendPendingMessages = async () => {
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
    const preparedMessagesToSend: Map<string, PreparedMessage> = new Map();
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
        let preparedMessage: PreparedMessage;
        if (
          message.contentType.startsWith("xmtp.org/remoteStaticAttachment:")
        ) {
          preparedMessage = await conversation.prepareMessage(
            deserializeRemoteAttachmentContent(message.content),
            {
              contentType: ContentTypeRemoteAttachment,
              contentFallback:
                "This app cannot display this media. You can use converse.xyz now to access it.",
            }
          );
        } else if (message.contentType.startsWith("xmtp.org/reaction:")) {
          preparedMessage = await conversation.prepareMessage(
            JSON.parse(message.content),
            {
              contentType: ContentTypeReaction,
              contentFallback: message.contentFallback || "Reaction",
            }
          );
        } else {
          preparedMessage = await conversation.prepareMessage(message.content);
        }

        const newMessageId = await preparedMessage.messageID();
        preparedMessagesToSend.set(newMessageId, preparedMessage);
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
    await updateMessagesIds(messageIdsToUpdate);
    await sendPreparedMessages(preparedMessagesToSend);
  } catch (e) {
    console.log(e);
  }
  sendingPendingMessages = false;
};

export const getLocalXmtpClient = async (currentAddress?: string) => {
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
  if (xmtpClient) {
    useChatStore.getState().setLocalClientConnected(true);
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
  const userAddress = useUserStore((s) => s.userAddress);
  const {
    initialLoadDone,
    localClientConnected,
    webviewClientConnected,
    reconnecting,
  } = useChatStore((s) =>
    pick(s, [
      "initialLoadDone",
      "localClientConnected",
      "webviewClientConnected",
      "reconnecting",
    ])
  );
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  const { setBlockedPeers } = useSettingsStore((s) =>
    pick(s, ["setBlockedPeers"])
  );
  // On open; opening XMTP session
  useEffect(() => {
    const initXmtp = async () => {
      try {
        await getLocalXmtpClient(userAddress);
      } catch (e) {
        console.log(
          "Count not instantiate local XMTP client, retrying in 3 seconds..."
        );
        await new Promise((r) => setTimeout(r, 3000));
        initXmtp();
      }
    };
    initXmtp();
  }, [userAddress]);

  const lastMessageSendingFinishedAt = useRef(0);
  const currentlyInMessageSendingInterval = useRef(false);
  const messageSendingInterval = useRef(() => {});
  useEffect(() => {
    messageSendingInterval.current = async () => {
      currentlyInMessageSendingInterval.current = true;
      // console.log("  in messageSendingInterval");
      if (
        localClientConnected &&
        webviewClientConnected &&
        splashScreenHidden &&
        initialLoadDone &&
        !reconnecting
      ) {
        try {
          await createPendingConversations();
          await sendPendingMessages();
        } catch (e) {
          console.log(e);
        }
      }
      currentlyInMessageSendingInterval.current = false;
      lastMessageSendingFinishedAt.current = new Date().getTime();
    };
  }, [
    splashScreenHidden,
    initialLoadDone,
    localClientConnected,
    webviewClientConnected,
    reconnecting,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      if (
        !currentlyInMessageSendingInterval.current &&
        now - lastMessageSendingFinishedAt.current > 1000
      ) {
        messageSendingInterval.current();
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (localClientConnected && webviewClientConnected) {
      getBlockedPeers()
        .then((addresses) => {
          setBlockedPeers(addresses);
        })
        .catch((e) => {
          console.log("Error while getting blocked peers", e);
        });
    }
  }, [setBlockedPeers, localClientConnected, webviewClientConnected]);
  return null;
}
