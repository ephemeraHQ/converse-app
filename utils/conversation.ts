import { Reaction } from "@xmtp/content-type-reaction";
import { MutableRefObject, createRef } from "react";
import { Alert, Platform } from "react-native";
import { createContext, useContextSelector } from "use-context-selector";

import { saveTopicsData } from "./api";
import {
  isAttachmentMessage,
  fetchLocalAttachmentUrl,
} from "./attachment/helpers";
import { getAddressForPeer } from "./eth";
import { getGroupIdFromTopic } from "./groupUtils/groupId";
import logger from "./logger";
import { subscribeToNotifications } from "./notifications";
import { pick } from "./objects";
import { getReactionsContentPreview } from "./reactions";
import { getMatchedPeerAddresses } from "./search";
import { sentryTrackMessage } from "./sentry";
import { TextInputWithValue, addressPrefix } from "./str";
import { isTransactionMessage } from "./transaction";
import { isOnXmtp } from "./xmtpRN/client";
import { isContentType } from "./xmtpRN/contentTypes";
import config from "../config";
import { createPendingConversation } from "../data/helpers/conversations/pendingConversations";
import { getChatStore, useChatStore } from "../data/store/accountsStore";
import {
  MediaPreview,
  TopicData,
  XmtpConversation,
  XmtpConversationWithUpdate,
  XmtpMessage,
} from "../data/store/chatStore";

export type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
export type ConversationFlatListItem =
  | ConversationWithLastMessagePreview
  | { topic: string };

export type LastMessagePreview = {
  contentPreview: string;
  message: XmtpMessage;
  imageUrl?: string;
};

export const conversationLastMessagePreview = async (
  conversation: XmtpConversation,
  myAddress: string
): Promise<LastMessagePreview | undefined> => {
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
        const imageUrl = await fetchLocalAttachmentUrl(lastMessage.id);
        return {
          contentPreview: "Shared an image",
          message: lastMessage,
          imageUrl,
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
          logger.error(e);
          removedReactions = {};
          continue;
        }
      } else if (
        isContentType("readReceipt", lastMessage?.contentType) ||
        isContentType("groupUpdated", lastMessage?.contentType) ||
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
      if (topic) {
        onSuccess(topic);
      } else {
        onError();
      }
    }
  }
};

type ConversationContextType = {
  conversation?: XmtpConversationWithUpdate;
  inputRef: MutableRefObject<TextInputWithValue | undefined>;
  mediaPreviewRef: MutableRefObject<MediaPreview | undefined>;
  isBlockedPeer: boolean;
  onReadyToFocus: () => void;
  messageToPrefill: string;
  mediaPreviewToPrefill: MediaPreview;
  transactionMode: boolean;
  setTransactionMode: (b: boolean) => void;
  frameTextInputFocused: boolean;
  setFrameTextInputFocused: (b: boolean) => void;
  onPullToRefresh?: () => void;
};

export const ConversationContext = createContext<ConversationContextType>({
  conversation: undefined,
  inputRef: createRef() as MutableRefObject<TextInputWithValue | undefined>,
  mediaPreviewRef: createRef() as MutableRefObject<MediaPreview | undefined>,
  isBlockedPeer: false,
  onReadyToFocus: () => {},
  messageToPrefill: "",
  mediaPreviewToPrefill: null,
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

// Whether a conversation should appear in Inbox OR Requests
// or just be totally hidden (blocked peer, deleted convo)
export const conversationShouldBeDisplayed = (
  conversation: ConversationWithLastMessagePreview,
  topicsData: { [topic: string]: TopicData | undefined },
  peersStatus: { [peer: string]: "blocked" | "consented" },
  groupsStatus: { [topic: string]: "allowed" | "denied" },
  pinnedConversations?: ConversationFlatListItem[]
) => {
  const isNotReady =
    (conversation.isGroup && !conversation.groupMembers) ||
    (!conversation.isGroup && !conversation.peerAddress);
  if (isNotReady) return false;
  const isPending = !!conversation.pending;
  const isNotEmpty = conversation.messages.size > 0;
  const isDeleted = topicsData[conversation.topic]?.status === "deleted";
  const isBlocked = conversation.isGroup
    ? // TODO: Add more conditions to filter out spam
      groupsStatus[conversation.topic] === "denied"
    : peersStatus[conversation.peerAddress.toLowerCase()] === "blocked";
  const isActive = conversation.isGroup ? conversation.isActive : true;
  const isV1 = conversation.version === "v1";
  const isForbidden = conversation.topic.includes("\x00"); // Forbidden character that breaks
  const isPinned = pinnedConversations?.find(
    (convo) => convo.topic === conversation.topic
  );
  return (
    (!isPending || isNotEmpty) &&
    !isDeleted &&
    !isBlocked &&
    !isV1 &&
    !isForbidden &&
    !isPinned &&
    isActive
  ); // Forbidden character that breaks notifications
};

// Wether a conversation should appear in Inbox tab (i.e. probably not a spam)
export const conversationShouldBeInInbox = (
  conversation: ConversationWithLastMessagePreview,
  peersStatus: { [peer: string]: "blocked" | "consented" },
  groupsStatus: { [topic: string]: "allowed" | "denied" }
) => {
  if (conversation.isGroup) {
    const groupId = getGroupIdFromTopic(conversation.topic);
    const isGroupAllowed = groupsStatus[groupId] === "allowed";
    const isCreatorAllowed =
      conversation.groupCreator &&
      peersStatus[conversation.groupCreator.toLowerCase()] === "consented";
    const isAddedByAllowed =
      conversation.groupAddedBy &&
      peersStatus[conversation.groupAddedBy.toLowerCase()] === "consented";
    return (
      conversation.hasOneMessageFromMe ||
      isGroupAllowed ||
      isCreatorAllowed ||
      isAddedByAllowed
    );
  } else {
    const isPeerConsented =
      peersStatus[conversation.peerAddress.toLowerCase()] === "consented";
    return conversation.hasOneMessageFromMe || isPeerConsented;
  }
};

export async function sortAndComputePreview(
  conversations: Record<string, XmtpConversation>,
  userAddress: string,
  topicsData: { [topic: string]: TopicData | undefined },
  peersStatus: { [peer: string]: "blocked" | "consented" },
  groupsStatus: { [topic: string]: "allowed" | "denied" },
  pinnedConversations?: ConversationFlatListItem[]
) {
  const conversationsRequests: ConversationWithLastMessagePreview[] = [];
  const conversationsInbox: ConversationWithLastMessagePreview[] = [];
  await Promise.all(
    Object.values(conversations).map(
      async (conversation: ConversationWithLastMessagePreview, i) => {
        const isNotReady =
          (conversation.isGroup && !conversation.groupMembers) ||
          (!conversation.isGroup && !conversation.peerAddress);
        if (isNotReady) return;

        if (
          conversationShouldBeDisplayed(
            conversation,
            topicsData,
            peersStatus,
            groupsStatus,
            pinnedConversations
          )
        ) {
          conversation.lastMessagePreview =
            await conversationLastMessagePreview(conversation, userAddress);
          if (
            conversationShouldBeInInbox(conversation, peersStatus, groupsStatus)
          ) {
            conversationsInbox.push(conversation);
          } else {
            conversationsRequests.push(conversation);
          }
        }
      }
    )
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

export function getFilteredConversationsWithSearch(
  searchQuery: string,
  sortedConversations: ConversationWithLastMessagePreview[],
  profiles: Record<string, any>
): ConversationFlatListItem[] {
  if (searchQuery && sortedConversations) {
    const matchedPeerAddresses = getMatchedPeerAddresses(profiles, searchQuery);
    const filteredConversations = sortedConversations.filter((conversation) => {
      if (conversation.isGroup) {
        return conversation.groupName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
      } else {
        return (
          conversation.peerAddress &&
          matchedPeerAddresses.includes(conversation.peerAddress)
        );
      }
    });
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
  const timestamp = new Date().getTime();
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
      topicsUpdates[topic] = {
        status: "read",
        readUntil: lastMessage.sent,
        timestamp,
      };
    }
  }
  return topicsUpdates;
};
