import { Reaction } from "@xmtp/content-type-reaction";
import { MutableRefObject, createRef } from "react";
import { Alert } from "react-native";
import { createContext, useContextSelector } from "use-context-selector";

import config from "../config";
import { createPendingConversation } from "../data/helpers/conversations/pendingConversations";
import { getChatStore, useChatStore } from "../data/store/accountsStore";
import {
  XmtpMessage,
  XmtpConversation,
  XmtpConversationWithUpdate,
} from "../data/store/chatStore";
import { isAttachmentMessage } from "./attachment";
import { getAddressForPeer } from "./eth";
import { pick } from "./objects";
import { getMatchedPeerAddresses } from "./search";
import { sentryTrackMessage } from "./sentry";
import { TextInputWithValue, addressPrefix } from "./str";
import { isOnXmtp } from "./xmtpJS/client";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

export type LastMessagePreview = {
  contentPreview: string;
  message: XmtpMessage;
};

export const conversationLastMessagePreview = (
  conversation: XmtpConversation,
  myAddress: string
): LastMessagePreview | undefined => {
  if (!conversation.messages?.size) return undefined;
  const messagesArray = Array.from(conversation.messages.values());
  let removedReactions: {
    [messageId: string]: { [reactionContent: string]: Reaction };
  } = {};
  while (messagesArray.length > 0) {
    const lastMessage = messagesArray.pop();

    if (!lastMessage) {
      return undefined;
    } else {
      if (isAttachmentMessage(lastMessage.contentType)) {
        removedReactions = {};
        return {
          contentPreview: "📎 Media",
          message: lastMessage,
        };
      } else if (lastMessage?.contentType?.startsWith("xmtp.org/reaction:")) {
        try {
          const reactionContent = JSON.parse(lastMessage.content) as Reaction;
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
            const isAttachment = isAttachmentMessage(message.contentType);
            if (reactionContent.schema === "unicode") {
              return {
                contentPreview: `Reacted ${reactionContent.content} to ${
                  isAttachment ? "a media" : `“${message.content}”`
                }`,
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
      } else {
        removedReactions = {};
        return {
          contentPreview: lastMessage.content,
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
  if (!conversationsIds.includes(undefined)) {
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
  const conversations = getChatStore(account).getState().conversations;
  // Then, check if we already have a main conversation with this address
  const alreadyConversationWithAddress = Object.values(conversations).find(
    (c) =>
      c.peerAddress?.toLowerCase() === peerAddress.toLowerCase() && !c.context
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
};

export const ConversationContext = createContext<ConversationContextType>({
  conversation: undefined,
  inputRef: createRef() as MutableRefObject<TextInputWithValue | undefined>,
  isBlockedPeer: false,
  onReadyToFocus: () => {},
  messageToPrefill: "",
});

export const useConversationContext = <K extends keyof ConversationContextType>(
  keys: K[]
) => useContextSelector(ConversationContext, (s) => pick(s, keys));

export function sortAndComputePreview(
  conversations: Record<string, XmtpConversation>,
  userAddress: string,
  deletedTopics: { [topic: string]: boolean }
): ConversationWithLastMessagePreview[] {
  const conversationWithPreview = Object.values(conversations)
    .filter(
      (a) =>
        a?.peerAddress &&
        (!a.pending || a.messages.size > 0) &&
        !deletedTopics[a.topic] &&
        a.version !== "v1"
    )
    .map((c: ConversationWithLastMessagePreview) => {
      c.lastMessagePreview = conversationLastMessagePreview(c, userAddress);
      return c;
    });

  conversationWithPreview.sort((a, b) => {
    const aDate = a.lastMessagePreview
      ? a.lastMessagePreview.message.sent
      : a.createdAt;
    const bDate = b.lastMessagePreview
      ? b.lastMessagePreview.message.sent
      : b.createdAt;
    return bDate - aDate;
  });

  return conversationWithPreview;
}

export function getConversationListItemsToDisplay(
  ephemeralAccount: boolean,
  searchQuery: string,
  sortedConversations: ConversationWithLastMessagePreview[],
  profiles: Record<string, any>
): FlatListItem[] {
  const items = ephemeralAccount ? [{ topic: "ephemeral" }] : [];

  if (searchQuery && sortedConversations) {
    const matchedPeerAddresses = getMatchedPeerAddresses(profiles, searchQuery);
    const filteredConversations = sortedConversations.filter((conversation) =>
      matchedPeerAddresses.includes(conversation.peerAddress)
    );
    return [...filteredConversations];
  } else {
    return [...items, ...sortedConversations, { topic: "welcome" }];
  }
}
