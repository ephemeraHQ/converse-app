import { Reaction } from "@xmtp/content-type-reaction";
import { MutableRefObject, createRef } from "react";
import { Alert, Platform } from "react-native";
import { createContext, useContextSelector } from "use-context-selector";

import config from "../config";
import { createPendingConversation } from "../data/helpers/conversations/pendingConversations";
import { getChatStore, useChatStore } from "../data/store/accountsStore";
import {
  XmtpMessage,
  XmtpConversation,
  XmtpConversationWithUpdate,
  TopicData,
} from "../data/store/chatStore";
import { saveTopicsData } from "./api";
import { isAttachmentMessage } from "./attachment/helpers";
import { getAddressForPeer } from "./eth";
import { subscribeToNotifications } from "./notifications";
import { pick } from "./objects";
import { getReactionsContentPreview } from "./reactions";
import { getMatchedPeerAddresses } from "./search";
import { sentryTrackMessage } from "./sentry";
import { TextInputWithValue, addressPrefix } from "./str";
import { isTransactionMessage } from "./transaction";
import { isOnXmtp } from "./xmtpRN/client";
import { isContentType } from "./xmtpRN/contentTypes";

export type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
export type ConversationFlatListItem =
  | ConversationWithLastMessagePreview
  | { topic: string };

export type LastMessagePreview = {
  contentPreview: string;
  message: XmtpMessage;
};

export const conversationLastMessagePreview = (
  conversation: XmtpConversation,
  myAddress: string
): LastMessagePreview | undefined => {
  if (!conversation.messages?.size) return undefined;
  const messageIds = conversation.messagesIds;
  let removedReactions: {
    [messageId: string]: { [reactionContent: string]: Reaction };
  } = {};
  for (let index = messageIds.length - 1; index >= 0; index--) {
    const lastMessageId = messageIds[index];
    const lastMessage = conversation.messages.get(lastMessageId);
    if (!lastMessage) {
      return undefined;
    } else {
      if (isAttachmentMessage(lastMessage.contentType)) {
        removedReactions = {};
        return {
          contentPreview: "📎 Media",
          message: lastMessage,
        };
      } else if (isTransactionMessage(lastMessage?.contentType)) {
        removedReactions = {};
        return {
          contentPreview: "💸 Transaction",
          message: lastMessage,
        };
      } else if (isContentType("reaction", lastMessage?.contentType)) {
        try {
          const reactionContent = JSON.parse(lastMessage.content) as Reaction;
          if (Platform.OS === "web") {
            if (reactionContent.action === "removed") {
              return {
                contentPreview: "Removed a reaction to a message",
                message: lastMessage,
              };
            } else if (reactionContent.schema === "unicode") {
              return {
                contentPreview: `Reacted ${reactionContent.content} to a message`,
                message: lastMessage,
              };
            }
            return {
              contentPreview: "Reacted to a message",
              message: lastMessage,
            };
          }
          const message = conversation.messages.get(reactionContent.reference);
          if (!message || message.senderAddress !== myAddress) continue;
          if (reactionContent.action === "removed") {
            removedReactions[reactionContent.reference] =
              removedReactions[reactionContent.reference] || {};
            removedReactions[reactionContent.reference][
              reactionContent.content
            ] = reactionContent;
            continue;
          }
          if (
            reactionContent.reference in removedReactions &&
            reactionContent.content in
              removedReactions[reactionContent.reference]
          ) {
            delete removedReactions[reactionContent.reference][
              reactionContent.content
            ];
            continue;
          } else {
            removedReactions = {};
            const contentPreview = getReactionsContentPreview(
              message,
              reactionContent.content
            );
            if (reactionContent.schema === "unicode") {
              return {
                contentPreview,
                message: lastMessage,
              };
            } else {
              return {
                contentPreview: "Reacted to a message",
                message: lastMessage,
              };
            }
          }
        } catch (e) {
          console.log(e);
          removedReactions = {};
          continue;
        }
      } else if (
        isContentType("readReceipt", lastMessage?.contentType) ||
        (!lastMessage.content && !lastMessage.contentFallback)
      ) {
        continue;
      } else {
        removedReactions = {};
        return {
          contentPreview:
            lastMessage.content || lastMessage.contentFallback || "",
          message: lastMessage,
        };
      }
    }
  }

  return undefined;
};

export const computeNewConversationContext = (
  userAddress: string,
  peerAddress: string
) => {
  let i = 0;
  const conversationsIds = Object.values(useChatStore.getState().conversations)
    .filter((c) => c.peerAddress?.toLowerCase() === peerAddress?.toLowerCase())
    .map((c) => c.context?.conversationId);
  // First try to create one without conversationId
  if (!conversationsIds.includes(undefined) && !conversationsIds.includes("")) {
    return undefined;
  }
  do {
    i += 1;
  } while (
    conversationsIds.includes(
      `${config.conversationDomain}/dm/${addressPrefix(
        userAddress || ""
      )}-${addressPrefix(peerAddress)}/${i}`
    )
  );
  const conversationId = `${config.conversationDomain}/dm/${addressPrefix(
    userAddress || ""
  )}-${addressPrefix(peerAddress)}/${i}`;
  return {
    conversationId,
    metadata: {},
  };
};

export const openMainConversationWithPeer = async (
  account: string,
  peerToCreateConvoWith: string,
  onSuccess: (topic: string) => void,
  onError: () => void
) => {
  // First, resolve the peer to an address
  const peerAddress = await getAddressForPeer(peerToCreateConvoWith);
  if (!peerAddress) {
    sentryTrackMessage("CREATE_CONVERSATION_ERROR", {
      error: "Identity not found",
    });
    Alert.alert(
      "Identity not found",
      `We could not find the address attached to ${peerToCreateConvoWith}`,
      [
        {
          text: "OK",
          onPress: onError,
          isPreferred: true,
        },
      ]
    );
    return;
  }
  // We need to wait for initial load to be done on web because there is
  // no hydration !
  if (Platform.OS === "web") {
    let initialLoadDone = getChatStore(account).getState().initialLoadDone;
    while (!initialLoadDone) {
      await new Promise((r) => setTimeout(r, 250));
      initialLoadDone = getChatStore(account).getState().initialLoadDone;
    }
  }
  const conversations = getChatStore(account).getState().conversations;
  // Then, check if we already have a main conversation with this address
  const alreadyConversationWithAddress = Object.values(conversations).find(
    (c) =>
      c.peerAddress?.toLowerCase() === peerAddress.toLowerCase() &&
      (!c.context || !c.context?.conversationId)
  );
  if (alreadyConversationWithAddress) {
    onSuccess(alreadyConversationWithAddress.topic);
  } else {
    // We don't have a convo with this peer, let's check if we
    // can create a new one
    const onNetwork = await isOnXmtp(peerAddress);
    if (!onNetwork) {
      Alert.alert(
        "Not yet using XMTP",
        "Your contact is not yet using XMTP. Tell them to download the app at converse.xyz and log in with their wallet.",
        [
          {
            text: "OK",
            onPress: onError,
            isPreferred: true,
          },
        ]
      );
    } else {
      // Creating the conversation locally in a lazy manner
      const topic = await createPendingConversation(
        account,
        peerAddress,
        undefined
      );
      onSuccess(topic);
    }
  }
};

type ConversationContextType = {
  conversation?: XmtpConversationWithUpdate;
  inputRef: MutableRefObject<TextInputWithValue | undefined>;
  isBlockedPeer: boolean;
  onReadyToFocus: () => void;
  messageToPrefill: string;
  transactionMode: boolean;
  setTransactionMode: (b: boolean) => void;
  frameTextInputFocused: boolean;
  setFrameTextInputFocused: (b: boolean) => void;
};

export const ConversationContext = createContext<ConversationContextType>({
  conversation: undefined,
  inputRef: createRef() as MutableRefObject<TextInputWithValue | undefined>,
  isBlockedPeer: false,
  onReadyToFocus: () => {},
  messageToPrefill: "",
  transactionMode: false,
  setTransactionMode: () => {},
  frameTextInputFocused: false,
  setFrameTextInputFocused: () => {},
});

export const useConversationContext = <K extends keyof ConversationContextType>(
  keys: K[]
) => useContextSelector(ConversationContext, (s) => pick(s, keys));

const conversationsSortMethod = (
  a: ConversationWithLastMessagePreview,
  b: ConversationWithLastMessagePreview
) => {
  const aDate = a.lastMessagePreview
    ? a.lastMessagePreview.message.sent
    : a.createdAt;
  const bDate = b.lastMessagePreview
    ? b.lastMessagePreview.message.sent
    : b.createdAt;
  return bDate - aDate;
};

export function sortAndComputePreview(
  conversations: Record<string, XmtpConversation>,
  userAddress: string,
  topicsData: { [topic: string]: TopicData | undefined },
  peersStatus: { [peer: string]: "blocked" | "consented" }
) {
  const conversationsRequests: ConversationWithLastMessagePreview[] = [];
  const conversationsInbox: ConversationWithLastMessagePreview[] = [];
  Object.values(conversations).forEach(
    (conversation: ConversationWithLastMessagePreview, i) => {
      if (
        conversation?.peerAddress &&
        (!conversation.pending || conversation.messages.size > 0) &&
        topicsData[conversation.topic]?.status !== "deleted" &&
        peersStatus[conversation.peerAddress.toLowerCase()] !== "blocked" &&
        conversation.version !== "v1" &&
        !conversation.topic.includes("\x00") // Forbidden character that breaks notifications
      ) {
        conversation.lastMessagePreview = conversationLastMessagePreview(
          conversation,
          userAddress
        );
        if (
          conversation.hasOneMessageFromMe ||
          peersStatus[conversation.peerAddress.toLowerCase()] === "consented" ||
          (conversation.spamScore !== undefined &&
            (conversation.spamScore === null || conversation.spamScore < 1))
        ) {
          conversationsInbox.push(conversation);
        } else {
          conversationsRequests.push(conversation);
        }
      }
    }
  );
  conversationsRequests.sort(conversationsSortMethod);
  conversationsInbox.sort(conversationsSortMethod);

  getChatStore(userAddress).getState().setSortedConversationsWithPreview({
    conversationsInbox,
    conversationsRequests,
  });
  setImmediate(() => {
    subscribeToNotifications(userAddress);
  });
}

export function getConversationListItemsToDisplay(
  searchQuery: string,
  sortedConversations: ConversationWithLastMessagePreview[],
  profiles: Record<string, any>
): ConversationFlatListItem[] {
  if (searchQuery && sortedConversations) {
    const matchedPeerAddresses = getMatchedPeerAddresses(profiles, searchQuery);
    const filteredConversations = sortedConversations.filter((conversation) =>
      matchedPeerAddresses.includes(conversation.peerAddress)
    );
    return filteredConversations;
  } else {
    return sortedConversations;
  }
}

export const markConversationsAsReadIfNecessary = async (account: string) => {
  while (!getChatStore(account).getState().topicsDataFetchedOnce) {
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (Object.keys(getChatStore(account).getState().topicsData).length > 0) {
    return;
  }
  const topicsUpdates = getTopicsUpdatesAsRead(
    getChatStore(account).getState().conversations
  );
  getChatStore(account).getState().setTopicsData(topicsUpdates);
  saveTopicsData(account, topicsUpdates);
};

export const getTopicsUpdatesAsRead = (conversations: {
  [topic: string]: XmtpConversationWithUpdate;
}) => {
  const topicsUpdates: {
    [topic: string]: TopicData;
  } = {};
  for (const topic in conversations) {
    const conversation = conversations[topic];
    const lastMessageId =
      conversation.messagesIds.length > 0
        ? conversation.messagesIds[conversation.messagesIds.length - 1]
        : undefined;
    const lastMessage = lastMessageId
      ? conversation.messages.get(lastMessageId)
      : undefined;
    if (lastMessage) {
      topicsUpdates[topic] = { status: "read", readUntil: lastMessage.sent };
    }
  }
  return topicsUpdates;
};
