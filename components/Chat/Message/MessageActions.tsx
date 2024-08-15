import { MessageContextMenuWrapperIOS } from "@components/MessageContextMenuWrappers/MessageContextMenuWrapperiOS";
import { useSelect } from "@data/store/storeHelpers";
import {
  messageBubbleColor,
  messageHighlightedBubbleColor,
  myMessageBubbleColor,
  myMessageHighlightedBubbleColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  AnimatedStyle,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import { MessageToDisplay } from "./Message";
import MessageTail from "./MessageTail";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { XmtpConversation } from "../../../data/store/chatStore";
import { useFramesStore } from "../../../data/store/framesStore";
import { ReanimatedTouchableOpacity } from "../../../utils/animations";
import { isAttachmentMessage } from "../../../utils/attachment/helpers";
import { useConversationContext } from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";
import {
  MessageReaction,
  addReactionToMessage,
  getEmojiName,
  removeReactionFromMessage,
} from "../../../utils/reactions";
import { UUID_REGEX } from "../../../utils/regex";
import { isTransactionMessage } from "../../../utils/transaction";
import EmojiPicker from "../../../vendor/rn-emoji-keyboard";

type Props = {
  children: React.ReactNode;
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
  hideBackground: boolean;
};

export default function ChatMessageActions({
  children,
  message,
  reactions,
  hideBackground = false,
}: Props) {
  const { conversation } = useConversationContext(["conversation"]);
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount() as string;
  const frames = useFramesStore().frames;
  const isFrame = !!frames[message.content.toLowerCase()];
  const styles = useStyles();
  const { setContextMenuShown } = useAppStore(
    useSelect(["setContextMenuShown"])
  );
  const [emojiPickerShown, setEmojiPickerShown] = useState(false);

  const canAddReaction =
    message.status !== "sending" && message.status !== "error";

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
          if (isAttachment || !canAddReaction) return;
          addReactionToMessage(conversation as XmtpConversation, message, "❤️");
        })
        .runOnJS(true),
    [canAddReaction, isAttachment, conversation, message]
  );

  const longPressGesture = useMemo(() => {
    return Gesture.LongPress()
      .onStart(() => {
        converseEventEmitter.emit("scrollChatToMessage", {
          messageId: message.id,
          animated: true,
        });
        setContextMenuShown(message.id);
      })
      .runOnJS(true);
  }, [message.id, setContextMenuShown]);

  const composed = useMemo(() => {
    // iOS Context Menu will handle the long press itself
    if (Platform.OS === "ios") {
      return Gesture.Simultaneous(doubleTapGesture);
    }
    return Gesture.Simultaneous(doubleTapGesture, longPressGesture);
  }, [doubleTapGesture, longPressGesture]);

  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  useEffect(() => {
    const myReactions = reactions[userAddress] || [];
    const newSelectedEmojis = Array.from(
      new Set(
        myReactions
          .filter((reaction) => reaction.schema === "unicode")
          .map((reaction) => getEmojiName(reaction.content))
          .filter((emojiName): emojiName is string => emojiName !== null)
      )
    );
    setSelectedEmojis(newSelectedEmojis);
  }, [reactions, userAddress]);

  const initialBubbleBackgroundColor = message.fromMe
    ? myMessageBubbleColor(colorScheme)
    : messageBubbleColor(colorScheme);

  const bubbleBackgroundColor = useSharedValue(initialBubbleBackgroundColor);

  // reinit color on recycling
  useEffect(() => {
    if (bubbleBackgroundColor.value !== initialBubbleBackgroundColor) {
      bubbleBackgroundColor.value = initialBubbleBackgroundColor;
    }
  }, [bubbleBackgroundColor, initialBubbleBackgroundColor]);

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: bubbleBackgroundColor.value,
    };
  }, [bubbleBackgroundColor, message.id]);
  const iosAnimatedTailStyle = useAnimatedStyle(
    () => ({
      color: bubbleBackgroundColor.value,
    }),
    [bubbleBackgroundColor]
  ) as AnimatedStyle;
  const [highlightingMessage, setHighlightingMessage] = useState(false);

  const highlightMessage = useCallback(
    (messageId: string) => {
      if (messageId === message.id) {
        setHighlightingMessage(true);
        bubbleBackgroundColor.value = withTiming(
          message.fromMe
            ? myMessageHighlightedBubbleColor(colorScheme)
            : messageHighlightedBubbleColor(colorScheme),
          {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            reduceMotion: ReduceMotion.System,
          }
        );
        setTimeout(() => {
          bubbleBackgroundColor.value = withTiming(
            initialBubbleBackgroundColor,
            {
              duration: 300,
              easing: Easing.inOut(Easing.quad),
              reduceMotion: ReduceMotion.System,
            },
            () => {
              runOnJS(setHighlightingMessage)(false);
            }
          );
        }, 800);
      }
    },
    [
      bubbleBackgroundColor,
      colorScheme,
      initialBubbleBackgroundColor,
      message.fromMe,
      message.id,
    ]
  );

  useEffect(() => {
    converseEventEmitter.on(`highlightMessage`, highlightMessage);
    return () => {
      converseEventEmitter.off("highlightMessage", highlightMessage);
    };
  }, [highlightMessage]);

  // Entrance animation for new messages. For sent messages,
  // we filter on UUIDs to avoid repeating the animation
  // when the message is received from the stream.
  const shouldAnimateIn =
    isAttachmentMessage(message.contentType) ||
    message.isLatestSettledFromPeer ||
    ((message.status === "sending" || message.status === "prepared") &&
      UUID_REGEX.test(message.id));
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (shouldAnimateIn && !hasAnimatedIn) {
      opacity.value = 0;
      scale.value = 0.7;
      translateY.value = 20;

      const timingConfig = {
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        onComplete: () => {
          runOnJS(setHasAnimatedIn)(true);
        },
      };

      const springConfig = {
        damping: 10,
        stiffness: 200,
        mass: 0.2,
        overshootClamping: false,
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
      };

      opacity.value = withTiming(1, timingConfig);
      scale.value = withSpring(1, springConfig);
      translateY.value = withSpring(0, springConfig);
    } else {
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
    }
  }, [shouldAnimateIn, hasAnimatedIn, opacity, scale, translateY]);

  const animateInStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  });
  // We use a mix of Gesture Detector AND TouchableOpacity
  // because GestureDetector is better for dual tap but if
  // we add the gesture detector for long press the long press
  // in the parsed text stops working (https://github.com/software-mansion/react-native-gesture-handler/issues/867)

  return (
    <>
      <GestureDetector gesture={composed}>
        <View style={[{ width: "100%" }, { overflow: "visible" }]}>
          <Animated.View style={[animateInStyle, styles.animateInWrapper]}>
            <ReanimatedTouchableOpacity
              activeOpacity={1}
              style={[
                styles.messageBubble,
                message.fromMe ? styles.messageBubbleMe : undefined,
                {
                  backgroundColor: hideBackground
                    ? "transparent"
                    : initialBubbleBackgroundColor,
                },
                highlightingMessage ? animatedBackgroundStyle : undefined,
                Platform.select({
                  default: {},
                  android: {
                    // Messages not from me
                    borderBottomLeftRadius:
                      !message.fromMe && message.hasNextMessageInSeries
                        ? 2
                        : 18,
                    borderTopLeftRadius:
                      !message.fromMe && message.hasPreviousMessageInSeries
                        ? 2
                        : 18,
                    // Messages from me
                    borderBottomRightRadius:
                      message.fromMe && message.hasNextMessageInSeries ? 2 : 18,
                    borderTopRightRadius:
                      message.fromMe && message.hasPreviousMessageInSeries
                        ? 2
                        : 18,
                  },
                }),
                {
                  // maxWidth: messageMaxWidth,
                },
              ]}
              onPress={() => {
                if (isAttachment) {
                  // Transfering attachment opening intent to component
                  converseEventEmitter.emit(
                    `openAttachmentForMessage-${message.id}` as const
                  );
                }
                if (isTransaction) {
                  // Transfering event to component
                  converseEventEmitter.emit(
                    `showActionSheetForTxRef-${message.id}`
                  );
                }
              }}
            >
              <MessageContextMenuWrapperIOS
                message={message}
                reactions={reactions}
                messageContent={
                  <View
                    style={{
                      alignSelf: message.fromMe ? "flex-end" : "flex-start",
                      alignItems: message.fromMe ? "flex-end" : "flex-start",
                    }}
                  >
                    {children}
                  </View>
                }
              >
                {children}
              </MessageContextMenuWrapperIOS>
            </ReanimatedTouchableOpacity>
            {!message.hasNextMessageInSeries &&
              !isFrame &&
              !isAttachment &&
              !isTransaction &&
              !hideBackground &&
              (Platform.OS === "ios" || Platform.OS === "web") && (
                <MessageTail
                  style={[
                    {
                      color: initialBubbleBackgroundColor,
                    },
                    highlightingMessage ? iosAnimatedTailStyle : undefined,
                  ]}
                  fromMe={message.fromMe}
                  colorScheme={colorScheme}
                  hideBackground={hideBackground}
                />
              )}
          </Animated.View>
        </View>
      </GestureDetector>
      {/* <View style={{width: 50, height: 20, backgroundColor: "red"}} />
      <GestureDetector gesture={composedGesture}>{children}</GestureDetector> */}
      <EmojiPicker
        onEmojiSelected={(e) => {
          if (!conversation) return;
          if (e.alreadySelected) {
            removeReactionFromMessage(conversation, message, e.emoji);
          } else {
            addReactionToMessage(conversation, message, e.emoji);
          }
        }}
        open={emojiPickerShown}
        onClose={() => setEmojiPickerShown(false)}
        enableRecentlyUsed
        enableCategoryChangeAnimation={false}
        enableCategoryChangeGesture
        enableSearchAnimation={false}
        enableSearchBar={false}
        expandable={false}
        categoryPosition="bottom"
        categoryOrder={["recently_used"]}
        selectedEmojis={selectedEmojis}
        theme={getEmojiPickerTheme(colorScheme)}
        styles={{
          container: {
            borderBottomLeftRadius: Platform.OS === "android" ? 0 : undefined,
            borderBottomRightRadius: Platform.OS === "android" ? 0 : undefined,
          },
        }}
      />
    </>
  );
}

const getEmojiPickerTheme = (colorScheme: ColorSchemeName) =>
  colorScheme === "light"
    ? {}
    : {
        backdrop: "#16161888",
        knob: "#766dfc",
        container: "#282829",
        header: "#fff",
        skinTonesContainer: "#252427",
        category: {
          icon: "#766dfc",
          iconActive: "#fff",
          container: "#252427",
          containerActive: "#282829",
        },
      };

const useStyles = () => {
  return StyleSheet.create({
    animateInWrapper: {
      alignSelf: "flex-start",
      flexDirection: "row",
      borderRadius: 18,
    },
    messageBubble: {
      flexShrink: 1,
      flexGrow: 0,
      minHeight: 32,
      borderRadius: 16,
    },
    messageBubbleMe: {
      marginLeft: "auto",
    },
  });
};
