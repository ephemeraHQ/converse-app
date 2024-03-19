import * as Haptics from "expo-haptics";
import { ReactNode, useMemo, useRef } from "react";
import {
  View,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  ColorSchemeName,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import {
  currentAccount,
  useChatStore,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { XmtpMessage } from "../../data/store/chatStore";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getRelativeDate } from "../../utils/date";
import { isDesktop } from "../../utils/device";
import { converseEventEmitter } from "../../utils/events";
import { LimitedMap } from "../../utils/objects";
import { getPreferredName } from "../../utils/profile";
import { getMessageReactions } from "../../utils/reactions";
import { getReadableProfile } from "../../utils/str";
import { isTransactionMessage } from "../../utils/transaction";
import {
  getMessageContentType,
  isContentType,
} from "../../utils/xmtpRN/contentTypes";
import ClickableText from "../ClickableText";
import ChatActionButton from "./ChatActionButton";
import ChatAttachmentBubble from "./ChatAttachmentBubble";
import ChatGroupChangeMessage from "./ChatGroupChangeMessage";
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
  isGroup: boolean;
};

const MessageSender = ({ message }: { message: MessageToDisplay }) => {
  const senderSocials = useProfilesStore(
    (s) => s.profiles[message.senderAddress]?.socials
  );
  const styles = useStyles();
  return (
    <Text style={styles.groupSender}>
      {getPreferredName(senderSocials, message.senderAddress)}
    </Text>
  );
};

function ChatMessage({ message, colorScheme, isGroup }: Props) {
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
    case "groupChange":
      messageContent = <ChatGroupChangeMessage message={message} />;
      break;
    default:
      messageContent = (
        <>
          {isGroup && !message.fromMe && <MessageSender message={message} />}
          <ClickableText
            style={[
              styles.messageText,
              message.fromMe ? styles.messageTextMe : undefined,
            ]}
          >
            {message.content || message.contentFallback}
            <View style={{ opacity: 0 }}>{metadata}</View>
          </ClickableText>
        </>
      );
      break;
  }

  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const isGroupChange = isContentType("groupChange", message.contentType);

  const reactions = getMessageReactions(message);
  const showInBubble = !isGroupChange;

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
          marginBottom: !message.hasNextMessageInSeries ? 8 : 2,
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
                <ChatActionButton picto="arrowshape.turn.up.left" />
              </Animated.View>
            );
          }}
          leftThreshold={10000} // Never trigger opening
          onSwipeableWillClose={() => {
            const translation = swipeableRef.current?.state.rowTranslation;
            if (translation && (translation as any)._value > 70) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              converseEventEmitter.emit("triggerReplyToMessage", message);
            }
          }}
          ref={swipeableRef}
        >
          <ChatMessageActions message={message} reactions={reactions}>
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
          </ChatMessageActions>
          <View style={{ height: 0, flexBasis: "100%" }} />
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
};

const renderedMessages = new LimitedMap<string, RenderedChatMessage>(50);

export default function CachedChatMessage({
  account,
  message,
  colorScheme,
  isGroup,
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
    });
    renderedMessages.set(`${account}-${message.id}`, {
      message,
      renderedMessage,
      colorScheme,
      isGroup,
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
      padding: 4,
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
    metadataContainer: {
      position: "absolute",
      bottom: 6,
      right: 12,
      zIndex: -1,
    },
    groupSender: {
      fontSize: 15,
      fontWeight: "500",
      color: textPrimaryColor(colorScheme),
    },
  });
};
