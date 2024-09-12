import { MessageContextMenu } from "@components/Chat/Message/MessageContextMenu";
import { TableViewItemType } from "@components/TableView/TableView";
import { TableViewPicto } from "@components/TableView/TableViewImage";
import { useSelect } from "@data/store/storeHelpers";
import { translate } from "@i18n/index";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  messageBubbleColor,
  messageHighlightedBubbleColor,
  myMessageBubbleColor,
  myMessageHighlightedBubbleColor,
} from "@styles/colors";
import { isFrameMessage } from "@utils/frames";
import { navigate } from "@utils/navigation";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
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
  measure,
  useAnimatedRef,
  withDelay,
} from "react-native-reanimated";

import { MessageToDisplay } from "./Message";
import { MessageReactionsList } from "./MessageReactionsList";
import MessageTail from "./MessageTail";
import { EmojiPicker } from "../../../containers/EmojiPicker";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { useFramesStore } from "../../../data/store/framesStore";
import { ReanimatedTouchableOpacity } from "../../../utils/animations";
import { isAttachmentMessage } from "../../../utils/attachment/helpers";
import { converseEventEmitter } from "../../../utils/events";
import {
  MessageReaction,
  addReactionToMessage,
} from "../../../utils/reactions";
import { UUID_REGEX } from "../../../utils/regex";
import { isTransactionMessage } from "../../../utils/transaction";

type Props = {
  children: React.ReactNode;
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
  hideBackground: boolean;
};

enum ContextMenuActions {
  REPLY = "Reply",
  COPY_MESSAGE = "Copy",
  SHARE_FRAME = "Share",
}

export default function ChatMessageActions({
  children,
  message,
  reactions,
  hideBackground = false,
}: Props) {
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount() as string;
  const styles = useStyles();
  const { setContextMenuShown } = useAppStore(
    useSelect(["setContextMenuShown"])
  );
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(20);
  const itemRectY = useSharedValue(0);
  const itemRectX = useSharedValue(0);
  const itemRectHeight = useSharedValue(0);
  const itemRectWidth = useSharedValue(0);
  const containerRef = useAnimatedRef<View>();
  const [isActive, setIsActive] = useState(false);

  const scaleBack = useCallback(() => {
    "worklet";
    scale.value = withTiming(1, {
      duration: 150 / 2,
    });
  }, [scale]);

  const activateAnimation = useCallback(() => {
    "worklet";
    const measured = measure(containerRef);
    if (!measured) return;

    itemRectY.value = measured.pageY;
    itemRectX.value = measured.pageX;
    itemRectHeight.value = measured.height;
    itemRectWidth.value = measured.width;
    opacity.value = withDelay(100, withTiming(0));
  }, [
    containerRef,
    itemRectY,
    itemRectX,
    itemRectHeight,
    itemRectWidth,
    opacity,
  ]);

  const onLongHoldCompletion = useCallback(
    (isFinished?: boolean) => {
      "worklet";
      if (isFinished) {
        activateAnimation();
        runOnJS(setIsActive)(true);
      }
    },
    [activateAnimation]
  );

  const scaleHold = useCallback(() => {
    "worklet";
    scale.value = withTiming(1.02, { duration: 210 }, onLongHoldCompletion);
  }, [scale, onLongHoldCompletion]);

  const canAddReaction =
    message.status !== "sending" && message.status !== "error";

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .onStart(() => {
        if (isAttachment) {
          // Transfering attachment opening intent to component
          converseEventEmitter.emit(
            `openAttachmentForMessage-${message.id}` as const
          );
        }
        if (isTransaction) {
          // Transfering event to component
          converseEventEmitter.emit(`showActionSheetForTxRef-${message.id}`);
        }
      })
      .runOnJS(true);
  }, [isAttachment, isTransaction, message]);

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
          if (isAttachment || !canAddReaction) return;
          addReactionToMessage(userAddress, message, "❤️");
        })
        .runOnJS(true),
    [canAddReaction, isAttachment, userAddress, message]
  );

  const longPressGesture = useMemo(() => {
    return Gesture.LongPress()
      .onStart(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        scaleHold();
        setContextMenuShown(message.id);
      })
      .onEnd(() => {
        scaleBack();
      })
      .runOnJS(true);
  }, [message.id, scaleBack, scaleHold, setContextMenuShown]);

  const composed = useMemo(() => {
    return Gesture.Simultaneous(tapGesture, doubleTapGesture, longPressGesture);
  }, [tapGesture, doubleTapGesture, longPressGesture]);

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

  const triggerReplyToMessage = useCallback(() => {
    converseEventEmitter.emit("triggerReplyToMessage", message);
  }, [message]);

  const frameURL = useMemo(() => {
    const isFrame = isFrameMessage(message);
    if (isFrame) {
      const frames = useFramesStore
        .getState()
        .getFramesForURLs(message.converseMetadata?.frames || []);
      return frames[0]?.url;
    }
    return null;
  }, [message]);

  const contextMenuItems = useMemo(() => {
    const items: TableViewItemType[] = [];
    items.push({
      title: translate("reply"),
      action: triggerReplyToMessage,
      id: ContextMenuActions.REPLY,
      rightView: <TableViewPicto symbol="arrowshape.turn.up.left" />,
    });
    if (!isAttachment && !isTransaction) {
      items.push({
        title: translate("copy"),
        rightView: <TableViewPicto symbol="doc.on.doc" />,
        id: ContextMenuActions.COPY_MESSAGE,
        action: () => {
          if (message.content) {
            Clipboard.setString(message.content);
          } else if (message.contentFallback) {
            Clipboard.setString(message.contentFallback);
          }
        },
      });
    }
    if (frameURL) {
      items.push({
        title: translate("share"),
        rightView: <TableViewPicto symbol="square.and.arrow.up" />,
        id: ContextMenuActions.SHARE_FRAME,
        action: () => {
          if (frameURL) {
            navigate("ShareFrame", { frameURL });
          }
        },
      });
    }
    return items;
  }, [
    frameURL,
    isAttachment,
    isTransaction,
    message.content,
    message.contentFallback,
    triggerReplyToMessage,
  ]);

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

  const onContextCloseAnimation = useCallback(() => {
    "worklet";
    opacity.value = 1;
    runOnJS(setIsActive)(false);
  }, [setIsActive, opacity]);

  const onContextClose = useCallback(() => {
    onContextCloseAnimation();
  }, [onContextCloseAnimation]);

  // We use a mix of Gesture Detector AND TouchableOpacity
  // because GestureDetector is better for dual tap but if
  // we add the gesture detector for long press the long press
  // in the parsed text stops working (https://github.com/software-mansion/react-native-gesture-handler/issues/867)

  const StyledMessage = useMemo(() => {
    return () => (
      <View
        style={[
          styles.messageContainer,
          { alignSelf: message.fromMe ? "flex-start" : "flex-end" },
        ]}
      >
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
          ]}
        >
          {children}
        </ReanimatedTouchableOpacity>
        {!message.hasNextMessageInSeries &&
          !frameURL &&
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
      </View>
    );
  }, [
    styles.messageContainer,
    styles.messageBubble,
    styles.messageBubbleMe,
    message.fromMe,
    message.hasNextMessageInSeries,
    message.hasPreviousMessageInSeries,
    hideBackground,
    initialBubbleBackgroundColor,
    highlightingMessage,
    animatedBackgroundStyle,
    children,
    frameURL,
    isAttachment,
    isTransaction,
    iosAnimatedTailStyle,
    colorScheme,
  ]);

  return (
    <>
      <GestureDetector gesture={composed}>
        <View style={[{ width: "100%" }, { overflow: "visible" }]}>
          <Animated.View
            ref={containerRef}
            style={[animateInStyle, styles.animateInWrapper]}
          >
            <StyledMessage />
          </Animated.View>
        </View>
      </GestureDetector>
      <EmojiPicker message={message} />

      <MessageContextMenu
        items={contextMenuItems}
        auxiliaryView={
          <MessageReactionsList
            dismissMenu={onContextClose}
            reactions={reactions}
            message={message}
          />
        }
        isActive={isActive}
        onClose={onContextClose}
        itemRectY={itemRectY}
        itemRectX={itemRectX}
        itemRectHeight={itemRectHeight}
        itemRectWidth={itemRectWidth}
        fromMe={message.fromMe}
      >
        <StyledMessage />
      </MessageContextMenu>
    </>
  );
}

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
      borderRadius: 18,
    },
    messageBubbleMe: {
      marginLeft: "auto",
    },
    messageContainer: {
      flexDirection: "row",
    },
  });
};
