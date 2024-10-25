import { useSelect } from "@data/store/storeHelpers";
import { FlashList } from "@shopify/flash-list";
import { itemSeparatorColor, tertiaryBackgroundColor } from "@styles/colors";
import { useAppTheme } from "@theme/useAppTheme";
import { getCleanAddress } from "@utils/evm/address";
import { FrameWithType } from "@utils/frames";
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

const usePeerSocials = () => {
  const conversation = useConversationContext("conversation");
  const peerSocials = useProfilesStore(
    useShallow((s) =>
      conversation?.peerAddress
        ? getProfile(conversation.peerAddress, s.profiles)?.socials
        : undefined
    )
  );

  return peerSocials;
};

const useRenderItem = ({
  xmtpAddress,
  conversation,
  framesStore,
  colorScheme,
}: {
  xmtpAddress: string;
  conversation: XmtpConversationWithUpdate | undefined;
  framesStore: {
    [frameUrl: string]: FrameWithType;
  };
  colorScheme: ColorSchemeName;
}) => {
  return useCallback(
    ({ item }: { item: MessageToDisplay }) => {
      return (
        <CachedChatMessage
          account={xmtpAddress}
          message={{ ...item }}
          colorScheme={colorScheme}
          isGroup={!!conversation?.isGroup}
          isFrame={!!framesStore[item.content.toLowerCase().trim()]}
        />
      );
    },
    [colorScheme, xmtpAddress, conversation?.isGroup, framesStore]
  );
};

const getItemType =
  (framesStore: { [frameUrl: string]: FrameWithType }) =>
  (item: MessageToDisplay) => {
    const fromMeString = item.fromMe ? "fromMe" : "notFromMe";
    if (
      isContentType("text", item.contentType) &&
      item.converseMetadata?.frames?.[0]
    ) {
      const frameUrl = item.converseMetadata?.frames?.[0];
      const frame = framesStore[frameUrl];
      // Recycle frames with the same aspect ratio
      return `FRAME-${
        frame?.frameInfo?.image?.aspectRatio || "1.91:1"
      }-${fromMeString}`;
    } else if (
      (isContentType("attachment", item.contentType) ||
        isContentType("remoteAttachment", item.contentType)) &&
      item.converseMetadata?.attachment?.size?.height &&
      item.converseMetadata?.attachment?.size?.width
    ) {
      const aspectRatio = (
        item.converseMetadata.attachment.size.width /
        item.converseMetadata.attachment.size.height
      ).toFixed(2);
      return `ATTACHMENT-${aspectRatio}-${fromMeString}`;
    } else {
      return `${item.contentType}-${fromMeString}`;
    }
  };

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

const useAnimatedListView = (
  conversation: XmtpConversationWithUpdate | undefined
) => {
  // The first message was really buggy on iOS & Android and this is due to FlashList
  // so we keep FlatList for new convos and switch to FlashList for bigger convos
  // that need great perf.
  return useMemo(() => {
    const isConversationNotPending = conversation && !conversation.pending;
    return isConversationNotPending && Platform.OS !== "web"
      ? ReanimatedFlashList
      : ReanimatedFlatList;
  }, [conversation]);
};

const useIsShowingPlaceholder = ({
  messages,
  isBlockedPeer,
  conversation,
}: {
  messages: MessageToDisplay[];
  isBlockedPeer: boolean;
  conversation: XmtpConversationWithUpdate | undefined;
}): boolean => {
  return messages.length === 0 || isBlockedPeer || !conversation;
};

const keyExtractor = (item: MessageToDisplay) => item.id;

export function Chat() {
  const conversation = useConversationContext("conversation");
  const AnimatedListView = useAnimatedListView(conversation);
  const isBlockedPeer = useConversationContext("isBlockedPeer");
  const onReadyToFocus = useConversationContext("onReadyToFocus");
  const transactionMode = useConversationContext("transactionMode");
  const frameTextInputFocused = useConversationContext("frameTextInputFocused");

  const xmtpAddress = useCurrentAccount() as string;
  const peerSocials = usePeerSocials();
  const isSplitScreen = useIsSplitScreen();
  const recommendationsData = useRecommendationsStore(
    useShallow((s) =>
      conversation?.peerAddress ? s.frens[conversation.peerAddress] : undefined
    )
  );

  const colorScheme = useColorScheme();
  const styles = useStyles();
  const messageAttachmentsLength = useChatStore(
    useShallow((s) => Object.keys(s.messageAttachments).length)
  );

  const listArray = useMemo(
    () => getListArray(xmtpAddress, conversation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      xmtpAddress,
      conversation,
      conversation?.lastUpdateAt,
      messageAttachmentsLength,
    ]
  );

  const hideInputIfFrameFocused = Platform.OS !== "web";

  const DEFAULT_INPUT_HEIGHT = 58;
  const chatInputHeight = useSharedValue(0);
  const chatInputDisplayedHeight = useDerivedValue(() => {
    return frameTextInputFocused && hideInputIfFrameFocused
      ? 0
      : chatInputHeight.value + DEFAULT_INPUT_HEIGHT;
  });

  const insets = useSafeAreaInsets();

  const { height: keyboardHeight } = useKeyboardAnimation();
  const tertiary = tertiaryBackgroundColor(colorScheme);

  const showChatInput = !!(
    conversation &&
    !isBlockedPeer &&
    (!conversation.isGroup ||
      conversation.groupMembers.includes(getCleanAddress(xmtpAddress)))
  );

  const textInputStyle = useAnimatedStyle(
    () => ({
      position: "absolute",
      width: "100%",
      backgroundColor: tertiary,
      height: "auto",
      zIndex: 1,
      transform: [
        { translateY: -Math.max(insets.bottom, keyboardHeight.value) },
      ] as any,
    }),
    [keyboardHeight, tertiary, insets.bottom]
  );

  const chatContentStyle = useAnimatedStyle(
    () => ({
      ...styles.chatContent,
      paddingBottom: showChatInput
        ? chatInputDisplayedHeight.value +
          Math.max(insets.bottom, keyboardHeight.value)
        : insets.bottom,
    }),
    [showChatInput, keyboardHeight, chatInputDisplayedHeight, insets.bottom]
  );

  const ListFooterComponent = useMemo(() => {
    const recommendationData = getProfileData(recommendationsData, peerSocials);
    if (!recommendationData || !conversation?.peerAddress) return null;
    return (
      <View style={styles.inChatRecommendations}>
        <Recommendation
          recommendationData={recommendationData}
          address={conversation.peerAddress}
          embedInChat
          isVisible
        />
      </View>
    );
  }, [
    conversation?.peerAddress,
    peerSocials,
    recommendationsData,
    styles.inChatRecommendations,
  ]);

  const { frames: framesStore } = useFramesStore(useSelect(["frames"]));

  const showPlaceholder = useIsShowingPlaceholder({
    messages: listArray,
    isBlockedPeer,
    conversation,
  });

  const renderItem = useRenderItem({
    xmtpAddress,
    conversation,
    framesStore,
    colorScheme,
  });

  const messageListRef = useRef<
    FlatList<MessageToDisplay> | FlashList<MessageToDisplay> | undefined
  >();

  const scrollToMessage = useCallback(
    (data: { messageId?: string; index?: number; animated?: boolean }) => {
      let index = data.index;
      if (index === undefined && data.messageId) {
        index = listArray.findIndex((m) => m.id === data.messageId);
      }
      if (index !== undefined) {
        messageListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.5,
          animated: !!data.animated,
        });
      }
    },
    [listArray]
  );

  useEffect(() => {
    converseEventEmitter.on("scrollChatToMessage", scrollToMessage);
    return () => {
      converseEventEmitter.off("scrollChatToMessage", scrollToMessage);
    };
  }, [scrollToMessage]);

  const handleOnLayout = useCallback(() => {
    setTimeout(() => {
      onReadyToFocus();
    }, 50);
  }, [onReadyToFocus]);

  return (
    <View
      style={styles.chatContainer}
      key={`chat-${
        conversation?.isGroup ? conversation?.topic : conversation?.peerAddress
      }-${conversation?.context?.conversationId || ""}-${isBlockedPeer}`}
    >
      <Animated.View style={chatContentStyle}>
        {conversation && listArray.length > 0 && !isBlockedPeer && (
          <AnimatedListView
            contentContainerStyle={styles.chat}
            data={listArray}
            refreshing={conversation?.pending}
            extraData={[peerSocials]}
            renderItem={renderItem}
            onLayout={handleOnLayout}
            ref={(r) => {
              if (r) {
                messageListRef.current = r;
              }
            }}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            // Causes a glitch on Android, no sure we need it for now
            // maintainVisibleContentPosition={{
            //   minIndexForVisible: 0,
            //   autoscrollToTopThreshold: 100,
            // }}
            estimatedListSize={
              isSplitScreen ? undefined : Dimensions.get("screen")
            }
            inverted
            keyExtractor={keyExtractor}
            getItemType={getItemType(framesStore)}
            keyboardShouldPersistTaps="handled"
            estimatedItemSize={80}
            // Size glitch on Android
            showsVerticalScrollIndicator={Platform.OS === "ios"}
            pointerEvents="auto"
            ListFooterComponent={ListFooterComponent}
          />
        )}
        {showPlaceholder && !conversation?.isGroup && (
          <ChatPlaceholder messagesCount={listArray.length} />
        )}
        {showPlaceholder && conversation?.isGroup && (
          <GroupChatPlaceholder messagesCount={listArray.length} />
        )}
        {conversation?.isGroup ? <GroupConsentPopup /> : <ConsentPopup />}
      </Animated.View>
      {showChatInput && (
        <>
          <ReanimatedView
            style={[
              textInputStyle,
              {
                display:
                  frameTextInputFocused && hideInputIfFrameFocused
                    ? "none"
                    : "flex",
              },
            ]}
          >
            {!transactionMode && <ChatInput inputHeight={chatInputHeight} />}
            {transactionMode && <TransactionInput />}
          </ReanimatedView>
          <View
            style={[
              styles.inputBottomFiller,
              { height: insets.bottom + DEFAULT_INPUT_HEIGHT },
            ]}
          />
        </>
      )}
    </View>
  );
}

// Lightweight chat preview component used for longpress on chat
export function ChatPreview() {
  const conversation = useConversationContext("conversation");
  const AnimatedListView = useAnimatedListView(conversation);
  const isBlockedPeer = useConversationContext("isBlockedPeer");
  const onReadyToFocus = useConversationContext("onReadyToFocus");

  const xmtpAddress = useCurrentAccount() as string;
  const peerSocials = usePeerSocials();

  const colorScheme = useColorScheme();
  const styles = useStyles();
  const messageAttachmentsLength = useChatStore(
    useShallow((s) => Object.keys(s.messageAttachments).length)
  );

  const listArray = useMemo(
    // Get only the last 20 messages for performance in preview
    () => getListArray(xmtpAddress, conversation, 20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      xmtpAddress,
      conversation,
      conversation?.lastUpdateAt,
      messageAttachmentsLength,
    ]
  );

  const { frames: framesStore } = useFramesStore(useSelect(["frames"]));

  const showPlaceholder = useIsShowingPlaceholder({
    messages: listArray,
    isBlockedPeer,
    conversation,
  });

  const renderItem = useRenderItem({
    xmtpAddress,
    conversation,
    framesStore,
    colorScheme,
  });

  const keyExtractor = useCallback((item: MessageToDisplay) => item.id, []);

  const messageListRef = useRef<
    FlatList<MessageToDisplay> | FlashList<MessageToDisplay> | undefined
  >();

  const handleOnLayout = useCallback(() => {
    setTimeout(() => {
      onReadyToFocus();
    }, 50);
  }, [onReadyToFocus]);

  return (
    <View
      style={styles.chatContainer}
      key={`chat-${conversation?.peerAddress}-${
        conversation?.context?.conversationId || ""
      }-${isBlockedPeer}`}
    >
      <Animated.View style={styles.chatPreviewContent}>
        {conversation && listArray.length > 0 && !isBlockedPeer && (
          <AnimatedListView
            contentContainerStyle={styles.chat}
            data={listArray}
            refreshing={conversation?.pending}
            extraData={[peerSocials]}
            renderItem={renderItem}
            onLayout={handleOnLayout}
            ref={(r) => {
              if (r) {
                messageListRef.current = r;
              }
            }}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            estimatedListSize={Dimensions.get("screen")}
            inverted
            keyExtractor={keyExtractor}
            getItemType={getItemType(framesStore)}
            keyboardShouldPersistTaps="handled"
            estimatedItemSize={80}
            showsVerticalScrollIndicator={false}
            pointerEvents="none"
          />
        )}
        {showPlaceholder && !conversation?.isGroup && (
          <ChatPlaceholder messagesCount={listArray.length} />
        )}
        {showPlaceholder && conversation?.isGroup && (
          <GroupChatPlaceholder messagesCount={listArray.length} />
        )}
      </Animated.View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  const { theme } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        chatContainer: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: theme.colors.background.surface,
        },
        chatContent: {
          backgroundColor: theme.colors.background.surface,
          flex: 1,
        },
        chatPreviewContent: {
          backgroundColor: theme.colors.background.surface,
          flex: 1,
          paddingBottom: 0,
        },
        chat: {
          backgroundColor: theme.colors.background.surface,
        },
        inputBottomFiller: {
          position: "absolute",
          width: "100%",
          bottom: 0,
          backgroundColor: theme.colors.background.surface,
          zIndex: 0,
        },
        inChatRecommendations: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
          marginHorizontal: 20,
          marginBottom: 10,
        },
      }),
    [colorScheme, theme]
  );
};
