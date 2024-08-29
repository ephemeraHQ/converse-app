import { MessageContextMenuWrapper } from "@components/MessageContextMenuWrappers/MessageContextMenuWrapper";
import {
  inversePrimaryColor,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import * as Haptics from "expo-haptics";
import React, { ReactNode, useCallback, useMemo, useRef } from "react";
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
  DimensionValue,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

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
import { getRelativeDate } from "../../../utils/date";
import { isDesktop } from "../../../utils/device";
import { converseEventEmitter } from "../../../utils/events";
import {
  getUrlToRender,
  isAllEmojisAndMaxThree,
} from "../../../utils/messageContent";
import { navigate } from "../../../utils/navigation";
import { LimitedMap } from "../../../utils/objects";
import { getPreferredAvatar, getPreferredName } from "../../../utils/profile";
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
import FramesPreviews from "../Frame/FramesPreviews";
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
  isFrame: boolean;
};

const MessageSender = ({ message }: { message: MessageToDisplay }) => {
  const address = useInboxIdStore(
    (s) => s.byInboxId[message.senderAddress]?.[0] ?? message.senderAddress
  );
  const senderSocials = useProfilesStore((s) => s.profiles[address]?.socials);
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
  const senderSocials = useProfilesStore((s) => s.profiles[address]?.socials);
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

function ChatMessage({ message, colorScheme, isGroup, isFrame }: Props) {
  const styles = useStyles();

  let messageContent: ReactNode;
  const contentType = getMessageContentType(message.contentType);

  const handleUrlPress = useCallback((url: string) => {
    const uri = url.toLowerCase().startsWith("http") ? url : `https://${url}`;

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
    !replyingToMessage && isAllEmojisAndMaxThree(message.content);

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
  const showInBubble = !isGroupUpdated;
  const showReactionsOutside = isAttachment || isFrame || isTransaction;

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

  const hasReactions = Object.keys(reactions).length > 0;

  const swipeableRef = useRef<Swipeable | null>(null);

  return (
    <View
      style={[
        styles.messageRow,
        {
          marginBottom: showStatus ? 8 : 2,
        },
      ]}
    >
      {message.dateChange && (
        <Text style={styles.date}>{getRelativeDate(message.sent)}</Text>
      )}
      {isGroup && !message.fromMe && !showInBubble && !isGroupUpdated && (
        <MessageSender message={message} />
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
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "flex-end",
            }}
          >
            {!message.fromMe && <MessageSenderAvatar message={message} />}
            <View style={{ flex: 1 }}>
              {isGroup &&
                !message.fromMe &&
                !message.hasPreviousMessageInSeries &&
                showInBubble && <MessageSender message={message} />}
              <View
                style={{
                  alignSelf: message.fromMe ? "flex-end" : "flex-start",
                  alignItems: message.fromMe ? "flex-end" : "flex-start",
                  maxWidth: messageMaxWidth,
                }}
              >
                <MessageContextMenuWrapper
                  message={message}
                  messageContent={messageContent}
                  reactions={reactions}
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
                      <View>
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
                          <ChatInputReplyBubble
                            replyingToMessage={replyingToMessage}
                            fromMe={message.fromMe}
                          />
                        </TouchableOpacity>
                        <View
                          style={{
                            alignSelf: "flex-start",
                          }}
                        >
                          {messageContent}
                        </View>
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
                        <View>{messageContent}</View>
                      </View>
                    )}
                    {!showReactionsOutside && (
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
                </MessageContextMenuWrapper>
                <View
                  style={showReactionsOutside && styles.outsideMetaContainer}
                >
                  {isFrame && (
                    <TouchableOpacity
                      onPress={() => handleUrlPress(message.content)}
                    >
                      <Text style={styles.linkToFrame}>
                        {getUrlToRender(message.content)}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {showReactionsOutside && (
                    <View style={styles.outsideReactionsContainer}>
                      <ChatMessageReactions
                        message={message}
                        reactions={reactions}
                      />
                    </View>
                  )}
                  {message.fromMe && !hasReactions && (
                    <MessageStatus message={message} />
                  )}
                </View>
              </View>
            </View>
          </View>
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
    "isLatestSettledFromMe",
    "isLatestSettledFromPeer",
    "isLoadingAttachment",
    "nextMessageIsLoadingAttachment",
    "reactions",
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
      paddingHorizontal: 10,
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
    date: {
      flexBasis: "100%",
      textAlign: "center",
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginTop: 12,
      marginBottom: 8,
      fontWeight: "bold",
    },
    replyToUsername: {
      fontSize: 12,
      marginBottom: 4,
      color: textSecondaryColor(colorScheme),
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    messageContentContainer: {
      padding: 10,
    },
    messageText: {
      color: textPrimaryColor(colorScheme),
      fontSize: 16,
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
    outsideMetaContainer: {
      marginTop: 4,
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
