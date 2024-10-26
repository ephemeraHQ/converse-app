import {
  inversePrimaryColor,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { useAppTheme } from "@theme/useAppTheme";
import { converseEventEmitter } from "@utils/events";
import { Haptics } from "@utils/haptics";
import React, { ReactNode, useCallback, useMemo, useRef } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Animated as RNAnimated,
  DimensionValue,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { MessageSenderAvatarDumb } from "./MessageSenderAvatar";
import { MessageStatusDumb } from "./MessageStatusDumb";
import ActionButton from "../ActionButton";
import ChatMessageActions from "./MessageActions";

const platformTouchableLongPressDelay = Platform.select({
  ios: 100,
  default: undefined,
});

const noop = () => {};

const platformTouchableOnLongPress = Platform.select({
  ios: noop,
  default: undefined,
});

type ChatMessageDumbProps = {
  message: MessageToDisplay;
  //
  isGroup: boolean;
  isFrame: boolean;
  showDate: boolean;
  showStatus: boolean;
  hideBackground: boolean;
  formattedDate: string;
  formattedTime: string;
  messageContent: ReactNode;
  isAttachment: boolean;
  senderAvatarUri: string | undefined;
  onAvatarPress: () => void;
  avatarFallbackName: string;
  messageSenderComponent: ReactNode;
  displayMessageSender: boolean;
  displayFramesPreviews: boolean;
  displayMessageStatus: boolean;
};

export const ChatMessageDumb = ({
  message,
  isGroup,
  isFrame,
  showDate,
  formattedDate,
  formattedTime,
  messageContent,
  isAttachment,
  showStatus,
  hideBackground,
  senderAvatarUri,
  onAvatarPress,
  avatarFallbackName,
  displayMessageSender,
  messageSenderComponent,
  displayFramesPreviews,
  displayMessageStatus,
}: ChatMessageDumbProps) => {
  const styles = useStyles();

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
    if (isAttachment) {
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
    isAttachment,
    message.dateChange,
    dateTimeDisplay,
    timeHeight,
    timeTranslateY,
    timeOpacity,
  ]);

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

  const isGroupUpdated = isContentType("groupUpdated", message.contentType);

  const reactions = useMemo(() => getMessageReactions(message), [message]);
  const hasReactions = Object.keys(reactions).length > 0;
  const isChatMessage = !isGroupUpdated;
  const shouldShowOutsideContentRow = isChatMessage && hasReactions;

  let messageMaxWidth: DimensionValue;

  if (isAttachment) {
    messageMaxWidth = "60%";
  } else {
    if (isFrame) {
      messageMaxWidth = "100%";
    } else messageMaxWidth = "85%";
  }

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
          marginBottom:
            showStatus || (!message.fromMe && !message.hasNextMessageInSeries)
              ? 8
              : 1,
        },
      ]}
    >
      {showDate && (
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTime}>{formattedDate}</Text>
          <Animated.Text style={[dateTimeAnimatedStyle, styles.dateTime]}>
            {` – ${formattedTime}`}
          </Animated.Text>
        </View>
      )}
      {!showDate && showTime && (
        <Animated.View style={timeAnimatedStyle}>
          <Text style={styles.dateTime}>{formattedTime}</Text>
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
          renderLeftActions={(
            progressAnimatedValue: RNAnimated.AnimatedInterpolation<
              string | number
            >
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
          }}
          leftThreshold={10000} // Never trigger opening
          onSwipeableWillClose={() => {
            const translation = swipeableRef.current?.state.rowTranslation;
            if (translation && (translation as any)._value > 70) {
              Haptics.successNotificationAsync();
              converseEventEmitter.emit("triggerReplyToMessage", message);
            }
          }}
          ref={swipeableRef}
        >
          <View style={styles.messageContainer}>
            {!message.fromMe && (
              <MessageSenderAvatarDumb
                avatarUri={senderAvatarUri}
                avatarName={avatarFallbackName}
                onPress={onAvatarPress}
                hasNextMessageInSeries={message.hasNextMessageInSeries}
              />
            )}
            <View style={{ flex: 1 }}>
              {displayMessageSender && messageSenderComponent}
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
                  {/* TODO: Frames previews */}
                  {/* {displayFramesPreviews && (
                    <FramesPreviews message={message} />
                  )} */}
                  {replyingToMessage ? (
                    <View>
                      <TouchableOpacity
                        style={[
                          styles.innerBubble,
                          message.fromMe ? styles.innerBubbleMe : undefined,
                        ]}
                        delayLongPress={platformTouchableLongPressDelay}
                        onLongPress={platformTouchableOnLongPress}
                        delayPressIn={75}
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
                        {/* TODO: Reply bubble */}
                        {/* <ChatInputReplyBubble
                          replyingToMessage={replyingToMessage}
                          fromMe={message.fromMe}
                        /> */}
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
                    <View style={styles.outsideReactionsContainer}>
                      {/* TODO: Reactions */}
                      {/* <ChatMessageReactions
                        message={message}
                        reactions={reactions}
                      /> */}
                    </View>
                    {isFrame && message.fromMe && !hasReactions && (
                      <MessageStatusDumb
                        shouldDisplay={showStatus}
                        isLatestSettledFromMe={message.isLatestSettledFromMe}
                        status={message.status}
                      />
                    )}
                  </View>
                ) : (
                  displayMessageStatus && (
                    <MessageStatusDumb
                      shouldDisplay={showStatus}
                      isLatestSettledFromMe={message.isLatestSettledFromMe}
                      status={message.status}
                    />
                  )
                )}
              </View>
            </View>
          </View>
        </Swipeable>
      )}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useAppTheme();

  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
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
        messageText: {
          color: textPrimaryColor(colorScheme),
          fontSize: 17,
        },
        messageTextMe: {
          color: inversePrimaryColor(colorScheme),
        },
        messageTextReply: {
          color: textPrimaryColor(colorScheme),
        },
        messageTextReplyMe: {
          color: inversePrimaryColor(colorScheme),
        },
        outsideContentRow: {
          marginTop: theme.spacing["4xs"],
          marginBottom: theme.spacing.xxxs,
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
      }),
    [theme, colorScheme]
  );
};
