import * as Haptics from "expo-haptics";
import { ReactNode, useCallback, useMemo, useRef } from "react";
import {
  Animated,
  ColorSchemeName,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import {
  currentAccount,
  useChatStore,
  useInboxIdStore,
  useProfilesStore,
} from "../../../data/store/accountsStore";
import { XmtpMessage } from "../../../data/store/chatStore";
import { isAttachmentMessage } from "../../../utils/attachment/helpers";
import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
  backgroundColor,
} from "../../../utils/colors";
import { getRelativeDate } from "../../../utils/date";
import { isDesktop } from "../../../utils/device";
import { converseEventEmitter } from "../../../utils/events";
import {
  getUrlToRender,
  isAllEmojisAndMaxThree,
} from "../../../utils/messageContent";
import { LimitedMap } from "../../../utils/objects";
import { getPreferredName } from "../../../utils/profile";
import { getMessageReactions } from "../../../utils/reactions";
import { getReadableProfile } from "../../../utils/str";
import { isTransactionMessage } from "../../../utils/transaction";
import {
  getMessageContentType,
  isContentType,
} from "../../../utils/xmtpRN/contentTypes";
import ClickableText from "../../ClickableText";
import ActionButton from "../ActionButton";
import AttachmentMessagePreview from "../Attachment/AttachmentMessagePreview";
import ChatGroupUpdatedMessage from "../ChatGroupUpdatedMessage";
import FramesPreviews from "../Frame/FramesPreviews";
import ChatInputReplyBubble from "../Input/InputReplyBubble";
import TransactionPreview from "../Transaction/TransactionPreview";
import ChatMessageActions from "./MessageActions";
import ChatMessageReactions from "./MessageReactions";
import MessageStatus from "./MessageStatus";

export type MessageToDisplay = XmtpMessage & {
  hasPreviousMessageInSeries: boolean;
  hasNextMessageInSeries: boolean;
  dateChange: boolean;
  fromMe: boolean;
};

type Props = {
  account: string;
  message: MessageToDisplay;
  colorScheme: ColorSchemeName;
  isGroup: boolean;
  isFrame: boolean;
};

const MessageSender = ({ message }: { message: MessageToDisplay }) => {
  const address = useInboxIdStore(
    (s) => s.byInboxId[message.senderAddress]?.[0] ?? message.senderAddress
  );
  const senderSocials = useProfilesStore((s) => s.profiles[address]?.socials);
  const styles = useStyles();
  return (
    <Text style={styles.groupSender}>
      {getPreferredName(senderSocials, message.senderAddress)}
    </Text>
  );
};

function ChatMessage({ message, colorScheme, isGroup, isFrame }: Props) {
  const styles = useStyles();
  const hideBackground = isAllEmojisAndMaxThree(message.content);

  let messageContent: ReactNode;
  const contentType = getMessageContentType(message.contentType);

  const handleUrlPress = useCallback((url: string) => {
    const uri = url.toLowerCase().startsWith("http") ? url : `https://${url}`;

    Linking.openURL(uri);
  }, []);

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
      messageContent = (
        <>
          {isGroup && !message.fromMe && <MessageSender message={message} />}
          <ClickableText
            style={[
              styles.messageText,
              message.fromMe ? styles.messageTextMe : undefined,
            ]}
          >
            {/* Don't show URL as part of message bubble if this is a frame */}
            {isFrame ? "" : message.content || message.contentFallback}
          </ClickableText>
        </>
      );
      break;
    }
  }

  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const isGroupUpdated = isContentType("groupUpdated", message.contentType);

  const reactions = getMessageReactions(message);
  const showInBubble = !isGroupUpdated;

  // maybe using useChatStore inside ChatMessage
  // leads to bad perf? Let's be cautious
  const replyingToMessage = useChatStore((s) =>
    message.referencedMessageId
      ? s.conversations[message.topic]?.messages.get(
          message.referencedMessageId
        )
      : undefined
  );

  const replyingToProfileName = useMemo(() => {
    if (!replyingToMessage?.senderAddress) return "";
    if (replyingToMessage.senderAddress === currentAccount()) return "You";
    return getReadableProfile(
      currentAccount(),
      replyingToMessage.senderAddress
    );
  }, [replyingToMessage?.senderAddress]);

  const swipeableRef = useRef<Swipeable | null>(null);

  return (
    <View
      style={[
        styles.messageRow,
        {
          marginBottom: !message.hasNextMessageInSeries ? 8 : 4,
        },
      ]}
    >
      {message.dateChange && (
        <Text style={styles.date}>{getRelativeDate(message.sent)}</Text>
      )}
      {!showInBubble && messageContent}
      {showInBubble && (
        <Swipeable
          overshootLeft
          hitSlop={{ left: -20 }}
          overshootFriction={1.5}
          containerStyle={styles.messageSwipeable}
          childrenContainerStyle={styles.messageSwipeableChildren}
          renderLeftActions={(
            progressAnimatedValue: Animated.AnimatedInterpolation<
              string | number
            >
          ) => {
            return (
              <Animated.View
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
              </Animated.View>
            );
          }}
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
          <ChatMessageActions
            message={message}
            reactions={reactions}
            hideBackground={hideBackground}
          >
            {isContentType("text", message.contentType) && (
              <FramesPreviews message={message} />
            )}
            {replyingToMessage ? (
              <View style={styles.messageWithInnerBubble}>
                <TouchableOpacity
                  style={[
                    styles.innerBubble,
                    message.fromMe ? styles.innerBubbleMe : undefined,
                  ]}
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
                      message.fromMe ? styles.messageTextMe : undefined,
                      styles.replyToUsername,
                    ]}
                  >
                    {replyingToProfileName}
                  </Text>
                  <ChatInputReplyBubble
                    replyingToMessage={replyingToMessage}
                    fromMe={message.fromMe}
                  />
                </TouchableOpacity>
                <View
                  style={
                    isContentType("text", message.contentType)
                      ? styles.messageTextReply
                      : undefined
                  }
                >
                  {messageContent}
                </View>
              </View>
            ) : (
              <View
                style={[
                  isAttachment || isTransaction
                    ? styles.messageWithInnerBubble
                    : styles.messageBubbleText,
                ]}
              >
                {messageContent}
              </View>
            )}
          </ChatMessageActions>
          <View style={{ height: 0, flexBasis: "100%" }} />
          <View
            style={{
              flexDirection: "row",
              flexBasis: "100%",
              justifyContent: "flex-end",
            }}
          >
            {isFrame && (
              <TouchableOpacity
                style={{ flexBasis: "100%" }}
                onPress={() => handleUrlPress(message.content)}
              >
                <Text
                  style={{
                    fontSize: 11,
                    padding: 4,
                    marginBottom: 16,
                    alignSelf: message.fromMe ? "flex-end" : "flex-start",
                    color: textSecondaryColor(colorScheme),
                  }}
                >
                  {getUrlToRender(message.content)}
                </Text>
              </TouchableOpacity>
            )}
            {!message.hasNextMessageInSeries && (
              <MessageStatus message={message} />
            )}
          </View>
          <ChatMessageReactions message={message} reactions={reactions} />
        </Swipeable>
      )}
    </View>
  );
}

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
  isFrame: boolean;
};

const renderedMessages = new LimitedMap<string, RenderedChatMessage>(50);

export default function CachedChatMessage({
  account,
  message,
  colorScheme,
  isGroup,
  isFrame = false,
}: Props) {
  const keysChangesToRerender: (keyof MessageToDisplay)[] = [
    "id",
    "sent",
    "status",
    "lastUpdateAt",
    "dateChange",
    "hasNextMessageInSeries",
    "hasPreviousMessageInSeries",
  ];
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
      isFrame,
    });
    renderedMessages.set(`${account}-${message.id}`, {
      message,
      renderedMessage,
      colorScheme,
      isGroup,
      isFrame,
    });
    return renderedMessage;
  } else {
    return alreadyRenderedMessage.renderedMessage;
  }
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    innerBubble: {
      backgroundColor: messageInnerBubbleColor(colorScheme),
      borderRadius: 14,
      width: "100%",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
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
      paddingHorizontal: Platform.OS === "android" ? 10 : 20,
    },
    messageSwipeableChildren: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
    },
    date: {
      flexBasis: "100%",
      textAlign: "center",
      fontSize: 11,
      color: textSecondaryColor(colorScheme),
      marginTop: 12,
      marginBottom: 8,
    },
    messageBubbleText: {
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "android" ? 6 : 7,
    },
    messageWithInnerBubble: {
      padding: 8,
    },
    replyToUsername: {
      fontSize: 15,
      fontWeight: "bold",
      marginBottom: 4,
      color: "white",
    },
    messageText: {
      fontSize: 16,
      color: textPrimaryColor(colorScheme),
    },
    messageTextMe: {
      color: backgroundColor(colorScheme),
    },
    messageTextReply: {
      paddingHorizontal: 8,
    },
    groupSender: {
      fontSize: 15,
      fontWeight: "500",
      color: textPrimaryColor(colorScheme),
    },
  });
};
