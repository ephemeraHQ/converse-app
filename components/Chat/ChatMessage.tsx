import * as Haptics from "expo-haptics";
import { ReactNode, useMemo, useRef } from "react";
import {
  View,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  ColorSchemeName,
  DimensionValue,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import MessageTail from "../../assets/message-tail.svg";
import ReplyIconDark from "../../assets/reply-dark.svg";
import ReplyIconLight from "../../assets/reply.svg";
import { useChatStore, currentAccount } from "../../data/store/accountsStore";
import { XmtpMessage } from "../../data/store/chatStore";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import {
  messageBubbleColor,
  messageInnerBubbleColor,
  myMessageBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getRelativeDate } from "../../utils/date";
import { isDesktop } from "../../utils/device";
import { converseEventEmitter } from "../../utils/events";
import { LimitedMap } from "../../utils/objects";
import { getMessageReactions } from "../../utils/reactions";
import { getReadableProfile } from "../../utils/str";
import { isTransactionMessage } from "../../utils/transaction";
import {
  getMessageContentType,
  isContentType,
} from "../../utils/xmtpRN/contentTypes";
import ClickableText from "../ClickableText";
import ChatAttachmentBubble from "./ChatAttachmentBubble";
import ChatMessageReplyBubble from "./ChatInputReplyBubble";
import ChatMessageActions from "./ChatMessageActions";
import ChatMessageFramePreviews from "./ChatMessageFramePreviews";
import ChatMessageMetadata from "./ChatMessageMetadata";
import ChatMessageReactions from "./ChatMessageReactions";
import ChatTransactionReference from "./ChatTransactionReference";

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
};

function ChatMessage({ message, colorScheme }: Props) {
  const styles = useStyles();

  const metadata = (
    <ChatMessageMetadata message={message} white={message.fromMe} />
  );

  let messageContent: ReactNode;
  const contentType = getMessageContentType(message.contentType);
  switch (contentType) {
    case "attachment":
    case "remoteAttachment":
      messageContent = <ChatAttachmentBubble message={message} />;
      break;
    case "transactionReference":
    case "coinbasePayment":
      messageContent = <ChatTransactionReference message={message} />;
      break;
    default: {
      messageContent = (
        <ClickableText
          style={[
            styles.messageText,
            message.fromMe ? styles.messageTextMe : undefined,
          ]}
        >
          {message.content || message.contentFallback}
          <View style={{ opacity: 0 }}>{metadata}</View>
        </ClickableText>
      );
      break;
    }
  }

  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const reactions = getMessageReactions(message);
  const ReplyIcon = colorScheme === "dark" ? ReplyIconDark : ReplyIconLight;

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
  let messageMaxWidth: DimensionValue;
  if (isDesktop) {
    if (isAttachment) {
      messageMaxWidth = 366;
    } else {
      messageMaxWidth = 588;
    }
  } else {
    if (isAttachment) {
      messageMaxWidth = "70%";
    } else {
      messageMaxWidth = "85%";
    }
  }

  const swipeableRef = useRef<Swipeable | null>(null);

  return (
    <View
      style={[
        styles.messageRow,
        {
          marginBottom: !message.hasNextMessageInSeries ? 8 : 2,
        },
      ]}
    >
      {message.dateChange && (
        <Text style={styles.date}>{getRelativeDate(message.sent)}</Text>
      )}
      <Swipeable
        overshootLeft
        hitSlop={{ left: -20 }}
        overshootFriction={1.5}
        containerStyle={styles.messageSwipeable}
        childrenContainerStyle={styles.messageSwipeableChildren}
        renderLeftActions={(
          progressAnimatedValue: Animated.AnimatedInterpolation<string | number>
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
              <ReplyIcon />
            </Animated.View>
          );
        }}
        leftThreshold={10000} // Never trigger opening
        onSwipeableWillClose={() => {
          const translation = swipeableRef.current?.state.rowTranslation;
          if (translation && (translation as any)._value > 70) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            converseEventEmitter.emit("triggerReplyToMessage", message);
          }
        }}
        ref={swipeableRef}
      >
        <ChatMessageActions
          message={message}
          reactions={reactions}
          style={[
            styles.messageBubble,
            message.fromMe ? styles.messageBubbleMe : undefined,
            Platform.select({
              default: {},
              android: {
                // Messages not from me
                borderBottomLeftRadius:
                  !message.fromMe && message.hasNextMessageInSeries ? 2 : 18,
                borderTopLeftRadius:
                  !message.fromMe && message.hasPreviousMessageInSeries
                    ? 2
                    : 18,
                // Messages from me
                borderBottomRightRadius:
                  message.fromMe && message.hasNextMessageInSeries ? 2 : 18,
                borderTopRightRadius:
                  message.fromMe && message.hasPreviousMessageInSeries ? 2 : 18,
              },
            }),
            {
              maxWidth: messageMaxWidth,
            },
          ]}
        >
          {isContentType("text", message.contentType) && (
            <ChatMessageFramePreviews message={message} />
          )}
          {replyingToMessage ? (
            <View style={styles.messageWithInnerBubble}>
              <TouchableOpacity
                style={[
                  styles.innerBubble,
                  message.fromMe ? styles.innerBubbleMe : undefined,
                ]}
                onPress={() => {
                  converseEventEmitter.emit("scrollChatToMessage", {
                    messageId: replyingToMessage.id,
                    animated: true,
                  });
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
                <ChatMessageReplyBubble
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

          <View style={styles.metadataContainer}>{metadata}</View>

          {!message.hasNextMessageInSeries &&
            (Platform.OS === "ios" || Platform.OS === "web") && (
              <MessageTail
                fill={
                  message.fromMe
                    ? myMessageBubbleColor(colorScheme)
                    : messageBubbleColor(colorScheme)
                }
                style={[
                  styles.messageTail,
                  message.fromMe ? styles.messageTailMe : undefined,
                ]}
              />
            )}
        </ChatMessageActions>
      </Swipeable>
      <ChatMessageReactions message={message} reactions={reactions} />
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
};

const renderedMessages = new LimitedMap<string, RenderedChatMessage>(50);

export default function CachedChatMessage({
  account,
  message,
  colorScheme,
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
    const renderedMessage = ChatMessage({ account, message, colorScheme });
    renderedMessages.set(`${account}-${message.id}`, {
      message,
      renderedMessage,
      colorScheme,
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
      marginBottom: 5,
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
    },
    date: {
      flexBasis: "100%",
      textAlign: "center",
      fontSize: 11,
      color: textSecondaryColor(colorScheme),
      marginTop: 12,
      marginBottom: 8,
    },
    messageBubble: {
      flexShrink: 1,
      flexGrow: 0,
      minHeight: 36,
      backgroundColor: messageBubbleColor(colorScheme),
      borderRadius: 18,
    },
    messageBubbleText: {
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "android" ? 6 : 7,
    },
    messageWithInnerBubble: {
      padding: 4,
    },
    messageBubbleMe: {
      marginLeft: "auto",
      backgroundColor: myMessageBubbleColor(colorScheme),
    },
    replyToUsername: {
      fontSize: 15,
      fontWeight: "bold",
      marginBottom: 4,
      color: textPrimaryColor(colorScheme),
    },
    messageText: {
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    messageTextMe: {
      color: "white",
    },
    messageTextReply: {
      paddingHorizontal: 8,
      paddingBottom: 4,
    },
    messageTail: {
      position: "absolute",
      left: -5,
      bottom: 0,
      width: 14,
      height: 21,
      zIndex: -1,
    },
    messageTailMe: {
      left: "auto",
      right: -5,
      transform: [{ scaleX: -1 }],
    },
    metadataContainer: {
      position: "absolute",
      bottom: 6,
      right: 12,
      zIndex: -1,
    },
  });
};
