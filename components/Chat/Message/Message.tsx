import { useFramesStore } from "@data/store/framesStore";
import {
  inversePrimaryColor,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { isFrameMessage } from "@utils/frames";
import * as Haptics from "expo-haptics";
import React, { ReactNode, useCallback, useMemo, useRef } from "react";
import {
  Animated as RNAnimated,
  ColorSchemeName,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  DimensionValue,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

import ChatMessageActions from "./MessageActions";
import ChatMessageReactions from "./MessageReactions";
import MessageStatus from "./MessageStatus";
import {
  currentAccount,
  useChatStore,
  useInboxIdStore,
  useProfilesStore,
} from "../../../data/store/accountsStore";
import { XmtpMessage } from "../../../data/store/chatStore";
import { isAttachmentMessage } from "../../../utils/attachment/helpers";
import { getLocalizedTime, getRelativeDate } from "../../../utils/date";
import { isDesktop } from "../../../utils/device";
import { converseEventEmitter } from "../../../utils/events";
import {
  getUrlToRender,
  isAllEmojisAndMaxThree,
} from "../../../utils/messageContent";
import { navigate } from "../../../utils/navigation";
import { LimitedMap } from "../../../utils/objects";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../../utils/profile";
import { getMessageReactions } from "../../../utils/reactions";
import { getReadableProfile } from "../../../utils/str";
import { isTransactionMessage } from "../../../utils/transaction";
import {
  getMessageContentType,
  isContentType,
} from "../../../utils/xmtpRN/contentTypes";
import Avatar from "../../Avatar";
import ClickableText from "../../ClickableText";
import ActionButton from "../ActionButton";
import AttachmentMessagePreview from "../Attachment/AttachmentMessagePreview";
import ChatGroupUpdatedMessage from "../ChatGroupUpdatedMessage";
import { FramesPreviews } from "../Frame/FramesPreviews";
import ChatInputReplyBubble from "../Input/InputReplyBubble";
import TransactionPreview from "../Transaction/TransactionPreview";

export type MessageToDisplay = XmtpMessage & {
  hasPreviousMessageInSeries: boolean;
  hasNextMessageInSeries: boolean;
  dateChange: boolean;
  fromMe: boolean;
  isLatestSettledFromMe: boolean;
  isLatestSettledFromPeer: boolean;
  isLoadingAttachment: boolean | undefined;
  nextMessageIsLoadingAttachment: boolean | undefined;
};

type Props = {
  account: string;
  message: MessageToDisplay;
  colorScheme: ColorSchemeName;
  isGroup: boolean;
  hasFrames: boolean;
};

// On iOS, the native context menu view handles the long press, but could potentially trigger the onPress event
// So we have to set a noop on long press on iOS so it doens't also trigger the onPress event
const platformTouchableLongPressDelay = Platform.select({
  ios: 100,
  default: undefined,
});

const noop = () => {};

const platformTouchableOnLongPress = Platform.select({
  ios: noop,
  default: undefined,
});

const MessageSender = ({ message }: { message: MessageToDisplay }) => {
  const address = useInboxIdStore(
    (s) => s.byInboxId[message.senderAddress]?.[0] ?? message.senderAddress
  );
  const senderSocials = useProfilesStore(
    (s) => getProfile(address, s.profiles)?.socials
  );
  const styles = useStyles();
  return (
    <View style={styles.groupSenderWrapper}>
      <Text style={styles.groupSender}>
        {getPreferredName(senderSocials, message.senderAddress)}
      </Text>
    </View>
  );
};

const MessageSenderAvatar = ({ message }: { message: MessageToDisplay }) => {
  const address = useInboxIdStore(
    (s) => s.byInboxId[message.senderAddress]?.[0] ?? message.senderAddress
  );
  const senderSocials = useProfilesStore(
    (s) => getProfile(address, s.profiles)?.socials
  );
  const styles = useStyles();
  const openProfile = useCallback(() => {
    navigate("Profile", { address: message.senderAddress });
  }, [message.senderAddress]);
  return (
    <View style={styles.groupSenderAvatarWrapper}>
      {!message.hasNextMessageInSeries ? (
        <TouchableOpacity onPress={openProfile}>
          <Avatar
            size={AvatarSizes.messageSender}
            uri={getPreferredAvatar(senderSocials)}
            name={getPreferredName(senderSocials, message.senderAddress)}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
    </View>
  );
};

const ChatMessage = ({
  account,
  message,
  colorScheme,
  isGroup,
  hasFrames,
}: Props) => {
  const styles = useStyles();

  const messageDate = useMemo(
    () => getRelativeDate(message.sent),
    [message.sent]
  );
  const messageTime = useMemo(
    () => getLocalizedTime(message.sent),
    [message.sent]
  );
  // The content is completely a frame so a larger full width frame will be shown
  const isFrame = useFramesStore(
    useShallow((s) =>
      isFrameMessage(
        isContentType("text", message.contentType),
        message.content,
        s.frames
      )
    )
  );

  // Reanimated shared values for time and date-time animations
  const timeHeight = useSharedValue(0);
  const timeTranslateY = useSharedValue(20);
  const timeOpacity = useSharedValue(0);
  const timeAnimatedStyle = useAnimatedStyle(() => ({
    height: timeHeight.value,
    overflow: "hidden",
    width: "100%",
    transform: [{ translateY: timeTranslateY.value }],
    opacity: timeOpacity.value,
  }));

  const dateTimeDisplay = useSharedValue<"none" | "flex">("none");
  const dateTimeAnimatedStyle = useAnimatedStyle(() => ({
    display: dateTimeDisplay.value,
  }));

  // Handle showTime animation
  const showTime = useRef<boolean>(false);
  const showDateTime = useRef<boolean>(false);
  const animateTime = useCallback(() => {
    if (isAttachmentMessage()) {
      return;
    }
    // For messages with date change
    if (message.dateChange) {
      showDateTime.current = !showDateTime.current;
      dateTimeDisplay.value = showDateTime.current ? "flex" : "none";
      return;
    }
    // For all other messages
    showTime.current = !showTime.current;
    const animationConfig = { duration: 300 };
    if (showTime.current) {
      timeHeight.value = withTiming(34, animationConfig);
      timeTranslateY.value = withTiming(0, animationConfig);
      timeOpacity.value = withTiming(1, animationConfig);
    } else {
      timeOpacity.value = withTiming(0, animationConfig);
      timeHeight.value = withTiming(0, animationConfig, () => {
        timeTranslateY.value = withTiming(20, animationConfig);
      });
    }
  }, [
    timeHeight,
    timeTranslateY,
    timeOpacity,
    dateTimeDisplay,
    message.dateChange,
  ]);

  let messageContent: ReactNode;
  const contentType = getMessageContentType(message.contentType);

  const handleUrlPress = useCallback((url: string) => {
    const cleanedUrl = url.toLowerCase().trim();

    const uri = cleanedUrl.startsWith("http")
      ? cleanedUrl
      : `https://${cleanedUrl}`;

    Linking.openURL(uri);
  }, []);

  // maybe using useChatStore inside ChatMessage
  // leads to bad perf? Let's be cautious
  const replyingToMessage = useChatStore((s) =>
    message.referencedMessageId
      ? s.conversations[message.topic]?.messages.get(
          message.referencedMessageId
        )
      : undefined
  );

  const hideBackground =
    isAttachmentMessage(message.contentType) ||
    (isContentType("text", message.contentType) &&
      !replyingToMessage &&
      isAllEmojisAndMaxThree(message.content));

  switch (contentType) {
    case "attachment":
    case "remoteAttachment":
      messageContent = <AttachmentMessagePreview message={message} />;
      break;
    case "transactionReference":
    case "coinbasePayment":
      messageContent = <TransactionPreview message={message} />;
      break;
    case "groupUpdated":
      messageContent = <ChatGroupUpdatedMessage message={message} />;
      break;
    default: {
      messageContent =
        // Don't show URL as part of message bubble if this is a frame
        !isFrame && (
          <View style={styles.messageContentContainer}>
            <ClickableText
              style={[
                styles.messageText,
                message.fromMe ? styles.messageTextMe : undefined,
                hideBackground ? styles.allEmojisAndMaxThree : undefined,
              ]}
            >
              {message.content || message.contentFallback}
            </ClickableText>
          </View>
        );
      break;
    }
  }

  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const isGroupUpdated = isContentType("groupUpdated", message.contentType);

  const reactions = useMemo(() => getMessageReactions(message), [message]);
  const hasReactions = Object.keys(reactions).length > 0;
  const isChatMessage = !isGroupUpdated;
  const shouldShowReactionsOutside =
    isChatMessage && (isAttachment || isFrame || isTransaction);
  const shouldShowReactionsInside =
    isChatMessage && !shouldShowReactionsOutside;
  const shouldShowOutsideContentRow =
    isChatMessage &&
    (isTransaction || isFrame || (isAttachment && hasReactions));

  let messageMaxWidth: DimensionValue;
  if (isDesktop) {
    if (isAttachment) {
      messageMaxWidth = 366;
    } else {
      messageMaxWidth = 588;
    }
  } else {
    if (isAttachment) {
      messageMaxWidth = "60%";
    } else {
      if (isFrame) {
        messageMaxWidth = "100%";
      } else messageMaxWidth = "85%";
    }
  }

  const showStatus =
    message.fromMe &&
    (!message.hasNextMessageInSeries ||
      (message.hasNextMessageInSeries &&
        message.nextMessageIsLoadingAttachment));

  const replyingToProfileName = useMemo(() => {
    if (!replyingToMessage?.senderAddress) return "";
    if (replyingToMessage.senderAddress === currentAccount()) return "You";
    return getReadableProfile(
      currentAccount(),
      replyingToMessage.senderAddress
    );
  }, [replyingToMessage?.senderAddress]);

  const swipeableRef = useRef<Swipeable | null>(null);

  const renderLeftActions = useCallback(
    (
      progressAnimatedValue: RNAnimated.AnimatedInterpolation<string | number>
    ) => {
      return (
        <RNAnimated.View
          style={{
            opacity: progressAnimatedValue.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0, 0, 1],
            }),
            height: "100%",
            justifyContent: "center",
            transform: [
              {
                translateX: progressAnimatedValue.interpolate({
                  inputRange: [0, 0.8, 1],
                  outputRange: [0, 0, 8],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        >
          <ActionButton picto="arrowshape.turn.up.left" />
        </RNAnimated.View>
      );
    },
    []
  );

  return (
    <View
      style={[
        styles.messageRow,
        {
          marginBottom:
            showStatus || (!message.fromMe && !message.hasNextMessageInSeries)
              ? 8
              : 1,
        },
      ]}
    >
      {message.dateChange && (
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTime}>{messageDate}</Text>
          <Animated.Text style={[dateTimeAnimatedStyle, styles.dateTime]}>
            {` – ${messageTime}`}
          </Animated.Text>
        </View>
      )}
      {!message.dateChange && showTime && (
        <Animated.View style={timeAnimatedStyle}>
          <Text style={styles.dateTime}>{messageTime}</Text>
        </Animated.View>
      )}
      {isGroupUpdated && messageContent}
      {isChatMessage && (
        <Swipeable
          overshootLeft
          hitSlop={{ left: -20 }}
          overshootFriction={1.5}
          containerStyle={styles.messageSwipeable}
          childrenContainerStyle={styles.messageSwipeableChildren}
          renderLeftActions={renderLeftActions}
          leftThreshold={10000} // Never trigger opening
          onSwipeableWillClose={() => {
            const translation = swipeableRef.current?.state.rowTranslation;
            if (translation && (translation as any)._value > 70) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
              converseEventEmitter.emit("triggerReplyToMessage", message);
            }
          }}
          ref={swipeableRef}
        >
          <View style={styles.messageContainer}>
            {!message.fromMe && <MessageSenderAvatar message={message} />}
            <View style={{ flex: 1 }}>
              {isGroup &&
                !message.fromMe &&
                !message.hasPreviousMessageInSeries &&
                isChatMessage && <MessageSender message={message} />}
              <View
                style={{
                  alignSelf: message.fromMe ? "flex-end" : "flex-start",
                  alignItems: message.fromMe ? "flex-end" : "flex-start",
                  maxWidth: messageMaxWidth,
                }}
              >
                <ChatMessageActions
                  message={message}
                  reactions={reactions}
                  hideBackground={hideBackground}
                  isFrame={isFrame}
                >
                  {isContentType("text", message.contentType) && (
                    <FramesPreviews message={message} />
                  )}
                  {replyingToMessage ? (
                    <View>
                      <TouchableOpacity
                        style={[
                          styles.innerBubble,
                          message.fromMe ? styles.innerBubbleMe : undefined,
                        ]}
                        delayLongPress={platformTouchableLongPressDelay}
                        onLongPress={platformTouchableOnLongPress}
                        delayPressIn={isDesktop ? 0 : 75}
                        onPress={() => {
                          converseEventEmitter.emit("scrollChatToMessage", {
                            messageId: replyingToMessage.id,
                            animated: false,
                          });
                          setTimeout(() => {
                            converseEventEmitter.emit(
                              "highlightMessage",
                              replyingToMessage.id
                            );
                          }, 350);
                        }}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            styles.replyToUsername,
                            message.fromMe ? styles.messageTextMe : undefined,
                          ]}
                        >
                          {replyingToProfileName}
                        </Text>
                        <ChatInputReplyBubble
                          replyingToMessage={replyingToMessage}
                          fromMe={message.fromMe}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={animateTime} activeOpacity={1}>
                        <View style={{ alignSelf: "flex-start" }}>
                          {messageContent}
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={[
                        { position: "relative" },
                        hideBackground && message.fromMe
                          ? { paddingBottom: 0 }
                          : undefined,
                      ]}
                    >
                      <TouchableOpacity onPress={animateTime} activeOpacity={1}>
                        <View>{messageContent}</View>
                      </TouchableOpacity>
                    </View>
                  )}
                  {shouldShowReactionsInside && (
                    <View
                      style={
                        hasReactions ? styles.reactionsContainer : { flex: 1 }
                      }
                    >
                      <ChatMessageReactions
                        message={message}
                        reactions={reactions}
                      />
                    </View>
                  )}
                </ChatMessageActions>
                {shouldShowOutsideContentRow ? (
                  <View style={styles.outsideContentRow}>
                    {isFrame && (
                      <TouchableOpacity
                        onPress={() => handleUrlPress(message.content)}
                        delayLongPress={platformTouchableLongPressDelay}
                        onLongPress={platformTouchableOnLongPress}
                      >
                        <Text style={styles.linkToFrame}>
                          {getUrlToRender(message.content)}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {shouldShowReactionsOutside && (
                      <View style={styles.outsideReactionsContainer}>
                        <ChatMessageReactions
                          message={message}
                          reactions={reactions}
                        />
                      </View>
                    )}
                    {isFrame && message.fromMe && !hasReactions && (
                      <MessageStatus message={message} />
                    )}
                  </View>
                ) : (
                  message.fromMe &&
                  !hasReactions && <MessageStatus message={message} />
                )}
              </View>
            </View>
          </View>
        </Swipeable>
      )}
    </View>
  );
};

// We use a cache for chat messages so that it doesn't rerender too often.
// Indeed, since we use an inverted FlashList for chat, when a new message
// arrives it is pushed at the BEGINNING of the array, and FlashList internals
// rerenders a bunch of messages which can have an impact on performance.
// With this LimitedMap we keep 50 rendered messages in RAM for better perf.

type RenderedChatMessage = {
  renderedMessage: JSX.Element;
  message: MessageToDisplay;
  colorScheme: ColorSchemeName;
  isGroup: boolean;
  hasFrames: boolean;
};

const renderedMessages = new LimitedMap<string, RenderedChatMessage>(50);
const keysChangesToRerender: (keyof MessageToDisplay)[] = [
  "id",
  "sent",
  "status",
  "lastUpdateAt",
  "dateChange",
  "hasNextMessageInSeries",
  "hasPreviousMessageInSeries",
  "isLatestSettledFromMe",
  "isLatestSettledFromPeer",
  "isLoadingAttachment",
  "nextMessageIsLoadingAttachment",
  "reactions",
];

export default function CachedChatMessage({
  account,
  message,
  colorScheme,
  isGroup,
  hasFrames = false,
}: Props) {
  const alreadyRenderedMessage = renderedMessages.get(
    `${account}-${message.id}`
  );
  const shouldRerender =
    !alreadyRenderedMessage ||
    alreadyRenderedMessage.colorScheme !== colorScheme ||
    keysChangesToRerender.some(
      (k) => message[k] !== alreadyRenderedMessage.message[k]
    );
  if (shouldRerender) {
    const renderedMessage = ChatMessage({
      account,
      message,
      colorScheme,
      isGroup,
      hasFrames,
    });
    renderedMessages.set(`${account}-${message.id}`, {
      message,
      renderedMessage,
      colorScheme,
      isGroup,
      hasFrames,
    });
    return renderedMessage;
  } else {
    return alreadyRenderedMessage.renderedMessage;
  }
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    messageContainer: {
      flexDirection: "row",
      width: "100%",
      alignItems: "flex-end",
    },
    innerBubble: {
      backgroundColor: messageInnerBubbleColor(colorScheme),
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 10,
      marginHorizontal: 10,
    },
    innerBubbleMe: {
      backgroundColor: myMessageInnerBubbleColor(colorScheme),
    },
    messageRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    messageSwipeable: {
      width: "100%",
      flexDirection: "row",
      paddingLeft: 12,
      paddingRight: 15,
      overflow: "visible",
    },
    messageSwipeableChildren: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
    },
    linkToFrame: {
      fontSize: 12,
      padding: 6,
      color: textSecondaryColor(colorScheme),
      flexGrow: 1,
    },
    dateTimeContainer: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    dateTime: {
      textAlign: "center",
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginTop: 12,
      marginBottom: 8,
      fontWeight: "bold",
      height: 20,
    },
    replyToUsername: {
      fontSize: 12,
      marginBottom: 4,
      color: textSecondaryColor(colorScheme),
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    messageContentContainer: {
      paddingHorizontal: 13,
      paddingVertical: 6,
    },
    messageText: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
    },
    messageTextMe: {
      color: inversePrimaryColor(colorScheme),
    },
    allEmojisAndMaxThree: {
      fontSize: 64,
      paddingHorizontal: 0,
    },
    messageTextReply: {
      color: textPrimaryColor(colorScheme),
    },
    messageTextReplyMe: {
      color: inversePrimaryColor(colorScheme),
    },
    groupSenderAvatarWrapper: {
      marginRight: 6,
    },
    groupSenderWrapper: {
      flexDirection: "row",
      flexBasis: "100%",
    },
    groupSender: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginLeft: 10,
      marginVertical: 4,
    },
    avatarPlaceholder: {
      width: AvatarSizes.messageSender,
      height: AvatarSizes.messageSender,
    },
    outsideContentRow: {
      marginTop: 1,
      flexDirection: "row",
      justifyContent: "flex-start",
      columnGap: 8,
      width: "100%",
    },
    reactionsContainer: {
      marginHorizontal: 8,
      marginBottom: 8,
    },
    outsideReactionsContainer: {
      flex: 1,
    },
  });
};
