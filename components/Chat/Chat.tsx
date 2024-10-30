import { useSelect } from "@data/store/storeHelpers";
import { FlashList } from "@shopify/flash-list";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
} from "@styles/colors";
import { getCleanAddress } from "@utils/evm/address";
import { FrameWithType, messageHasFrames } from "@utils/frames";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ColorSchemeName,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import ChatPlaceholder from "./ChatPlaceholder/ChatPlaceholder";
import { GroupChatPlaceholder } from "./ChatPlaceholder/GroupChatPlaceholder";
import ConsentPopup from "./ConsentPopup/ConsentPopup";
import { GroupConsentPopup } from "./ConsentPopup/GroupConsentPopup";
import ChatInput from "./Input/Input";
import CachedChatMessage, { MessageToDisplay } from "./Message/Message";
import TransactionInput from "./Transaction/TransactionInput";
import {
  useCurrentAccount,
  useProfilesStore,
  useRecommendationsStore,
  useChatStore,
} from "../../data/store/accountsStore";
import { XmtpConversationWithUpdate } from "../../data/store/chatStore";
import { useFramesStore } from "../../data/store/framesStore";
import { useIsSplitScreen } from "../../screens/Navigation/navHelpers";
import {
  ReanimatedFlashList,
  ReanimatedFlatList,
  ReanimatedView,
} from "../../utils/animations";
import { useKeyboardAnimation } from "../../utils/animations/keyboardAnimation";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import { useConversationContext } from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import { getProfile, getProfileData } from "../../utils/profile";
import { UUID_REGEX } from "../../utils/regex";
import { isContentType } from "../../utils/xmtpRN/contentTypes";
import { Recommendation } from "../Recommendations/Recommendation";

// ... (rest of the imports and component code)

const getListArray = (
  xmtpAddress?: string,
  conversation?: XmtpConversationWithUpdate,
  lastMessages?: number // Optional parameter to limit the number of messages
) => {
  const messageAttachments = useChatStore.getState().messageAttachments;
  const isAttachmentLoading = (messageId: string) => {
    const attachment = messageAttachments && messageAttachments[messageId];
    return attachment?.loading;
  };

  if (!conversation) return [];
  const reverseArray = [];
  // Filter out unwanted content types before list or reactions out of order can mess up the logic
  const filteredMessageIds = conversation.messagesIds.filter((messageId) => {
    const message = conversation.messages.get(messageId) as MessageToDisplay;
    if (!message || (!message.content && !message.contentFallback))
      return false;

    // Reactions & read receipts are not displayed in the flow
    const notDisplayedContentTypes = [
      "xmtp.org/reaction:",
      "xmtp.org/readReceipt:",
    ];

    if (isAttachmentMessage(message.contentType) && UUID_REGEX.test(message.id))
      return false;

    return !notDisplayedContentTypes.some((c) =>
      message.contentType.startsWith(c)
    );
  });

  let latestSettledFromMeIndex = -1;
  let latestSettledFromPeerIndex = -1;

  for (let index = filteredMessageIds.length - 1; index >= 0; index--) {
    const messageId = filteredMessageIds[index];
    const message = conversation.messages.get(messageId) as MessageToDisplay;

    message.fromMe =
      !!xmtpAddress &&
      xmtpAddress.toLowerCase() === message.senderAddress.toLowerCase();

    message.hasNextMessageInSeries = false;
    message.hasPreviousMessageInSeries = false;

    if (index > 0) {
      const previousMessageId = filteredMessageIds[index - 1];
      const previousMessage = conversation.messages.get(previousMessageId);
      if (previousMessage) {
        message.dateChange =
          differenceInCalendarDays(message.sent, previousMessage.sent) > 0;
        if (
          previousMessage.senderAddress.toLowerCase() ===
            message.senderAddress.toLowerCase() &&
          !message.dateChange &&
          !isContentType("groupUpdated", previousMessage.contentType)
        ) {
          message.hasPreviousMessageInSeries = true;
        }
      }
    } else {
      message.dateChange = true;
    }

    if (index < filteredMessageIds.length - 1) {
      const nextMessageId = filteredMessageIds[index + 1];
      const nextMessage = conversation.messages.get(nextMessageId);
      if (nextMessage) {
        // Here we need to check if next message has a date change
        const nextMessageDateChange =
          differenceInCalendarDays(nextMessage.sent, message.sent) > 0;
        if (
          nextMessage.senderAddress.toLowerCase() ===
            message.senderAddress.toLowerCase() &&
          !nextMessageDateChange &&
          !isContentType("groupUpdated", nextMessage.contentType)
        ) {
          message.hasNextMessageInSeries = true;
        }
      }
    }

    if (
      message.fromMe &&
      message.status !== "sending" &&
      message.status !== "prepared" &&
      latestSettledFromMeIndex === -1
    ) {
      latestSettledFromMeIndex = reverseArray.length;
    }

    if (!message.fromMe && latestSettledFromPeerIndex === -1) {
      latestSettledFromPeerIndex = reverseArray.length;
    }

    message.isLatestSettledFromMe =
      reverseArray.length === latestSettledFromMeIndex;
    message.isLatestSettledFromPeer =
      reverseArray.length === latestSettledFromPeerIndex;

    if (index === filteredMessageIds.length - 1) {
      message.isLoadingAttachment =
        isAttachmentMessage(message.contentType) &&
        isAttachmentLoading(message.id);
    }

    if (index === filteredMessageIds.length - 2) {
      const nextMessageId = filteredMessageIds[index + 1];
      const nextMessage = conversation.messages.get(nextMessageId);
      message.nextMessageIsLoadingAttachment =
        isAttachmentMessage(nextMessage?.contentType) &&
        isAttachmentLoading(nextMessageId);
    }
    reverseArray.push(message);
  }

  // If lastMessages is defined, slice the array to return only the last n messages
  if (lastMessages !== undefined) {
    return reverseArray.slice(0, lastMessages);
  }

  return reverseArray;
};

// ... (rest of the component code)
