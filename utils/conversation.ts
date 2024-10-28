import { PeersStatus, GroupStatus } from "@data/store/settingsStore";
import { translate } from "@i18n";
import { Reaction } from "@xmtp/content-type-reaction";
import { MutableRefObject, createRef } from "react";
import { Alert, Platform } from "react-native";
import { createContext, useContextSelector } from "use-context-selector";

import { saveTopicsData } from "./api";
import {
  isAttachmentMessage,
  fetchLocalAttachmentUrl,
} from "./attachment/helpers";
import { getAddressForPeer } from "./evm/address";
import { getGroupIdFromTopic } from "./groupUtils/groupId";
import logger from "./logger";
import { subscribeToNotifications } from "./notifications";
import { getReactionsContentPreview } from "./reactions";
import { getMatchedPeerAddresses } from "./search";
import { TextInputWithValue, addressPrefix } from "./str";
import { isTransactionMessage } from "./transaction";
import config from "../config";
import { isOnXmtp } from "./xmtpRN/client";
import { isContentType } from "./xmtpRN/contentTypes";
import { createPendingConversation } from "../data/helpers/conversations/pendingConversations";
import { getChatStore, useChatStore } from "../data/store/accountsStore";
import {
  MediaPreview,
  TopicData,
  TopicsData,
  XmtpConversation,
  XmtpConversationWithUpdate,
  XmtpMessage,
} from "../data/store/chatStore";

export type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};

export type ConversationFlatListHiddenRequestItem = {
  topic: "hiddenRequestsButton";
  toggleActivated: boolean;
  spamCount: number;
};

export type ConversationFlatListItem =
  | ConversationWithLastMessagePreview
  | ConversationFlatListHiddenRequestItem;

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
  let isDone = false;
  setTimeout(() => {
    if (!isDone) {
      isDone = true;
      Alert.alert(
        translate("identity_not_found_title"),
        translate("identity_not_found_timeout", {
          identity: peerToCreateConvoWith,
        }),
        [
          {
            text: "OK",
            onPress: onError,
            isPreferred: true,
          },
        ]
      );
    }
  }, 5000);
  // First, resolve the peer to an address
  let peerAddress: string | undefined = undefined;
  try {
    peerAddress = await getAddressForPeer(peerToCreateConvoWith);
  } catch (e) {
    logger.error(e, {
      context: "Failed to resolve peer address",
      peer: peerToCreateConvoWith,
    });
  }
  if (!peerAddress) {
    isDone = true;
    Alert.alert(
      translate("identity_not_found_title"),
      translate("identity_not_found", { identity: peerToCreateConvoWith }),
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
      c.peerAddress?.toLowerCase() === peerAddress?.toLowerCase() &&
      (!c.context || !c.context?.conversationId)
  );
  if (alreadyConversationWithAddress && !isDone) {
    isDone = true;
    onSuccess(alreadyConversationWithAddress.topic);
  } else {
    // We don't have a convo with this peer, let's check if we
    // can create a new one
    const onNetwork = await isOnXmtp(peerAddress);
    if (!onNetwork && !isDone) {
      isDone = true;
      Alert.alert(
        translate("identity_not_yet_xmtp_title"),
        translate("identity_not_yet_xmtp", { identity: peerToCreateConvoWith }),
        [
          {
            text: "OK",
            onPress: onError,
            isPreferred: true,
          },
        ]
      );
    } else if (!isDone) {
      // Creating the conversation locally in a lazy manner
      const topic = await createPendingConversation(
        account,
        peerAddress,
        undefined
      );
      isDone = true;
      if (topic) {
        onSuccess(topic);
      } else {
        onError();
      }
    }
  }
};

export type ConversationContextType = {
  topic?: string;
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
  tagsFetchedOnceForMessage: MutableRefObject<{
    [messageId: string]: boolean;
  }>;
};

export const ConversationContext = createContext<ConversationContextType>({
  topic: undefined,
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
  tagsFetchedOnceForMessage: createRef() as MutableRefObject<{
    [messageId: string]: boolean;
  }>,
});

export const useConversationContext = <K extends keyof ConversationContextType>(
  key: K
) => useContextSelector(ConversationContext, (s) => s[key]);

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
  topicsData: TopicsData,
  pinnedConversations?: ConversationFlatListItem[]
) => {
  const isNotReady =
    (conversation.isGroup && !conversation.groupMembers) ||
    (!conversation.isGroup && !conversation.peerAddress);
  if (isNotReady) return false;
  const isPending = !!conversation.pending;
  const isNotEmpty = conversation.messages.size > 0;
  const isDeleted = topicsData[conversation.topic]?.status === "deleted";
  const isActive = conversation.isGroup ? conversation.isActive : true;
  const isV1 = conversation.version === "v1";
  const isForbidden = conversation.topic.includes("\x00"); // Forbidden character that breaks
  const isPinned = pinnedConversations?.find(
    (convo) => convo.topic === conversation.topic
  );
  return (
    (!isPending || isNotEmpty) &&
    !isDeleted &&
    !isV1 &&
    !isForbidden &&
    !isPinned &&
    isActive
  ); // Forbidden character that breaks notifications
};

// Wether a conversation should appear in Inbox tab (i.e. probably not a spam)
export const conversationShouldBeInInbox = (
  conversation: ConversationWithLastMessagePreview,
  peersStatus: PeersStatus,
  groupStatus: GroupStatus
) => {
  if (conversation.isGroup) {
    const groupId = getGroupIdFromTopic(conversation.topic);
    const isGroupBlocked = groupStatus[groupId] === "denied";
    const isGroupAllowed = groupStatus[groupId] === "allowed";
    const isCreatorAllowed =
      conversation.groupCreator &&
      peersStatus[conversation.groupCreator.toLowerCase()] === "consented";
    const isAddedByAllowed =
      conversation.groupAddedBy &&
      peersStatus[conversation.groupAddedBy.toLowerCase()] === "consented";
    if (isGroupBlocked) {
      return false;
    }
    return (
      conversation.hasOneMessageFromMe ||
      isGroupAllowed ||
      isCreatorAllowed ||
      isAddedByAllowed
    );
  } else {
    const isBlockedPeer =
      peersStatus[conversation.peerAddress.toLowerCase()] === "blocked";
    const isPeerConsented =
      peersStatus[conversation.peerAddress.toLowerCase()] === "consented";
    return (
      (!isBlockedPeer && conversation.hasOneMessageFromMe) || isPeerConsented
    );
  }
};

// Wether a conversation is blocked
export const isConversationBlocked = (
  conversation: ConversationWithLastMessagePreview,
  peersStatus: PeersStatus,
  groupStatus: GroupStatus
) => {
  if (conversation.isGroup) {
    const groupId = getGroupIdFromTopic(conversation.topic);
    const isGroupBlocked = groupStatus[groupId] === "denied";
    return isGroupBlocked;
  } else {
    const isPeerBlocked =
      peersStatus[conversation.peerAddress.toLowerCase()] === "blocked";
    return isPeerBlocked;
  }
};

export async function sortAndComputePreview(
  conversations: Record<string, XmtpConversation>,
  userAddress: string,
  topicsData: TopicsData,
  peersStatus: PeersStatus,
  groupStatus: GroupStatus,
  pinnedConversations?: ConversationFlatListItem[]
) {
  const conversationsRequests: ConversationWithLastMessagePreview[] = [];
  const conversationsInbox: ConversationWithLastMessagePreview[] = [];
  const conversationsBlocked: ConversationWithLastMessagePreview[] = [];
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
            pinnedConversations
          )
        ) {
          conversation.lastMessagePreview =
            await conversationLastMessagePreview(conversation, userAddress);
          if (
            conversationShouldBeInInbox(conversation, peersStatus, groupStatus)
          ) {
            conversationsInbox.push(conversation);
          } else if (
            isConversationBlocked(conversation, peersStatus, groupStatus)
          ) {
            conversationsBlocked.push(conversation);
          } else {
            conversationsRequests.push(conversation);
          }
        }
      }
    )
  );
  conversationsRequests.sort(conversationsSortMethod);
  conversationsInbox.sort(conversationsSortMethod);
  conversationsBlocked.sort(conversationsSortMethod);

  getChatStore(userAddress).getState().setSortedConversationsWithPreview({
    conversationsInbox,
    conversationsRequests,
    conversationsBlocked,
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
