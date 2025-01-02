import { ConversationVersion } from "@xmtp/react-native-sdk";
import { TopicsData } from "../data/store/chatStore";
import { ConversationWithCodecsType } from "./xmtpRN/client.types";

export type ConversationFlatListHiddenRequestItem = {
  topic: "hiddenRequestsButton";
  toggleActivated: boolean;
  spamCount: number;
};

export type ConversationFlatListItem = ConversationFlatListHiddenRequestItem;

// export type ConversationContextType = {
//   topic?: ConversationTopic;
//   inputRef: MutableRefObject<TextInputWithValue | undefined>;
//   mediaPreviewRef: MutableRefObject<MediaPreview | undefined>;
//   isBlockedPeer: boolean;
//   onReadyToFocus: () => void;
//   messageToPrefill: string;
//   mediaPreviewToPrefill: MediaPreview;
//   frameTextInputFocused: boolean;
//   setFrameTextInputFocused: (b: boolean) => void;
//   tagsFetchedOnceForMessage: MutableRefObject<{
//     [messageId: string]: boolean;
//   }>;
// };

// export const ConversationContext = createContext<ConversationContextType>({
//   topic: undefined,
//   inputRef: createRef() as MutableRefObject<TextInputWithValue | undefined>,
//   mediaPreviewRef: createRef() as MutableRefObject<MediaPreview | undefined>,
//   isBlockedPeer: false,
//   onReadyToFocus: () => {},
//   messageToPrefill: "",
//   mediaPreviewToPrefill: null,
//   frameTextInputFocused: false,
//   setFrameTextInputFocused: () => {},
//   tagsFetchedOnceForMessage: createRef() as MutableRefObject<{
//     [messageId: string]: boolean;
//   }>,
// });

// export const useConversationContext = <K extends keyof ConversationContextType>(
//   key: K
// ) => useContextSelector(ConversationContext, (s) => s[key]);

// Whether a conversation should appear in Inbox OR Requests
// or just be totally hidden (blocked peer, deleted convo)
export const conversationShouldBeDisplayed = (
  conversation: ConversationWithCodecsType,
  topicsData: TopicsData,
  pinnedConversations?: string[]
) => {
  // const isNotReady =
  //   (conversation.isGroup && !conversation.groupMembers) ||
  //   (!conversation.isGroup && !conversation.peerAddress);
  // if (isNotReady) return false;
  // const isPending = !!conversation.pending;
  // const isNotEmpty = conversation.messages.size > 0;
  // const isDeleted = topicsData[conversation.topic]?.status === "deleted";
  // const isActive = conversation.isGroup ? conversation.isActive : true;
  // const isV1 = conversation.version === "v1";
  // const isForbidden = conversation.topic.includes("\x00"); // Forbidden character that breaks
  // const isPinned = pinnedConversations?.find(
  //   (convo) => convo === conversation.topic
  // );
  // return (
  //   (!isPending || isNotEmpty) &&
  //   !isDeleted &&
  //   !isV1 &&
  //   !isForbidden &&
  //   !isPinned &&
  //   isActive
  // ); // Forbidden character that breaks notifications
};

// Wether a conversation should appear in Inbox tab (i.e. probably not a spam)
export const conversationShouldBeInInbox = (
  conversation: ConversationWithCodecsType
) => {
  if (conversation.version === ConversationVersion.GROUP) {
    const isGroupBlocked = conversation.state === "denied";
    const isGroupAllowed = conversation.state === "allowed";
    if (isGroupBlocked) {
      return false;
    }
    return isGroupAllowed;
  } else {
    const isPeerConsented = conversation.state === "allowed";
    return isPeerConsented;
  }
};

// Wether a conversation is blocked
export const isConversationBlocked = (
  conversation: ConversationWithCodecsType
) => {
  if (conversation.version === ConversationVersion.GROUP) {
    // TODO: Check if inboxId is blocked as well
    return conversation.state === "denied";
  } else {
    return conversation.state === "denied";
  }
};
