import Clipboard from "@react-native-clipboard/clipboard";
import {
  actionSheetColors,
  messageBubbleColor,
  messageHighlightedBubbleColor,
  myMessageBubbleColor,
  myMessageHighlightedBubbleColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ColorSchemeName,
  DimensionValue,
  Platform,
  StyleSheet,
  useColorScheme,
} from "react-native";
import ContextMenu from "react-native-context-menu-view";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  AnimatedStyle,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  currentAccount,
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { XmtpConversation } from "../../../data/store/chatStore";
import { useFramesStore } from "../../../data/store/framesStore";
import { ReanimatedTouchableOpacity } from "../../../utils/animations";
import { reportMessage } from "../../../utils/api";
import { isAttachmentMessage } from "../../../utils/attachment/helpers";
import { useConversationContext } from "../../../utils/conversation";
import { isDesktop } from "../../../utils/device";
import { converseEventEmitter } from "../../../utils/events";
import {
  MessageReaction,
  addReactionToMessage,
  getEmojiName,
  removeReactionFromMessage,
} from "../../../utils/reactions";
import { isTransactionMessage } from "../../../utils/transaction";
import { consentToPeersOnProtocol } from "../../../utils/xmtpRN/conversations";
import EmojiPicker from "../../../vendor/rn-emoji-keyboard";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./Message";
import MessageTail from "./MessageTail";

type Props = {
  children: React.ReactNode;
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
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
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const frames = useFramesStore().frames;
  const isFrame = !!frames[message.content.toLowerCase()];
  const styles = useStyles();

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

  const report = useCallback(async () => {
    reportMessage({
      account: currentAccount(),
      messageId: message.id,
      messageContent: message.content,
      messageSender: message.senderAddress,
    });

    Alert.alert("Message reported");
  }, [message]);

  const reportAndBlock = useCallback(async () => {
    reportMessage({
      account: currentAccount(),
      messageId: message.id,
      messageContent: message.content,
      messageSender: message.senderAddress,
    });
    consentToPeersOnProtocol(currentAccount(), [message.senderAddress], "deny");
    setPeersStatus({ [message.senderAddress]: "blocked" });
  }, [message.content, message.id, message.senderAddress, setPeersStatus]);

  const showMessageReportActionSheet = useCallback(async () => {
    if (Platform.OS === "web") {
      // Fixes double action sheet on web
      await new Promise((r) => setTimeout(r, 100));
    }
    const methods = {
      Report: report,
      "Report and block": reportAndBlock,
      Cancel: () => {},
    };

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: "Report this message",
        message:
          "This message will be forwarded to Converse. The contact will not be informed.",
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: [0, 1],
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [colorScheme, report, reportAndBlock]);

  const [emojiPickerShown, setEmojiPickerShown] = useState(false);

  const showReactionModal = useCallback(() => {
    setEmojiPickerShown(true);
  }, []);

  const triggerReplyToMessage = useCallback(() => {
    converseEventEmitter.emit("triggerReplyToMessage", message);
  }, [message]);

  const canAddReaction =
    message.status !== "sending" && message.status !== "error";

  const showMessageActionSheet = useCallback(() => {
    const methods: any = {};
    if (canAddReaction) {
      methods["Add a reaction"] = showReactionModal;
    }
    methods["Reply"] = triggerReplyToMessage;
    if (!isAttachment && !isTransaction) {
      methods["Copy message"] = message.content
        ? () => Clipboard.setString(message.content)
        : () => Clipboard.setString(message.contentFallback!);
      if (!message.fromMe) {
        methods["Report message"] = showMessageReportActionSheet;
      }
    }

    methods.Cancel = () => {};

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: isTransaction
          ? "💸 Transaction"
          : isAttachment
          ? "📎 Media"
          : message.content,
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: message.fromMe
          ? undefined
          : options.indexOf("Report message"),
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [
    canAddReaction,
    isAttachment,
    isTransaction,
    message.content,
    message.fromMe,
    message.contentFallback,
    colorScheme,
    showReactionModal,
    showMessageReportActionSheet,
    triggerReplyToMessage,
  ]);

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

  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  useEffect(() => {
    const myReaction = reactions[userAddress];
    const newSelectedEmojis = [];
    if (myReaction && myReaction.schema === "unicode") {
      const emojiName = getEmojiName(myReaction.content);
      if (emojiName) {
        newSelectedEmojis.push(emojiName);
      }
    }
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

  const contextMenuItems = useMemo(() => {
    const items = [];

    if (canAddReaction) {
      items.push({ title: "Add a reaction", systemIcon: "smiley" });
    }
    items.push({ title: "Reply", systemIcon: "arrowshape.turn.up.left" });
    if (!isAttachment && !isTransaction) {
      items.push({ title: "Copy message", systemIcon: "doc.on.doc" });
      if (!message.fromMe) {
        items.push({
          title: "Report message",
          systemIcon: "exclamationmark.triangle",
        });
      }
    }

    return items;
  }, [canAddReaction, isAttachment, isTransaction, message.fromMe]);

  const handleContextMenuAction = useCallback(
    (event: { nativeEvent: { index: number } }) => {
      const { index } = event.nativeEvent;
      switch (contextMenuItems[index].title) {
        case "Add a reaction":
          showReactionModal();
          break;
        case "Reply":
          triggerReplyToMessage();
          break;
        case "Copy message":
          if (message.content) {
            Clipboard.setString(message.content);
          } else if (message.contentFallback) {
            Clipboard.setString(message.contentFallback);
          }
          break;
        case "Report message":
          Alert.alert(
            "Report this message",
            "This message will be forwarded to Converse. The contact will not be informed.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Report", onPress: report },
              { text: "Report and block", onPress: reportAndBlock },
            ]
          );
          break;
      }
      useAppStore.getState().setContextMenuShown(false);
    },
    [
      contextMenuItems,
      showReactionModal,
      triggerReplyToMessage,
      message,
      report,
      reportAndBlock,
    ]
  );

  // We use a mix of Gesture Detector AND TouchableOpacity
  // because GestureDetector is better for dual tap but if
  // we add the gesture detector for long press the long press
  // in the parsed text stops working (https://github.com/software-mansion/react-native-gesture-handler/issues/867)

  return (
    <>
      <GestureDetector gesture={doubleTapGesture}>
        <ContextMenu
          actions={contextMenuItems}
          onPress={handleContextMenuAction}
          onCancel={() => useAppStore.getState().setContextMenuShown(false)}
          previewBackgroundColor={initialBubbleBackgroundColor}
          style={[{ width: "100%" }, { overflow: "visible" }]}
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
                    message.fromMe && message.hasPreviousMessageInSeries
                      ? 2
                      : 18,
                },
              }),
              {
                maxWidth: messageMaxWidth,
              },
            ]}
            onPress={() => {
              if (isAttachment) {
                // Transfering attachment opening intent to component
                converseEventEmitter.emit(
                  `openAttachmentForMessage-${message.id}`
                );
              }
              if (isTransaction) {
                // Transfering event to component
                converseEventEmitter.emit(
                  `showActionSheetForTxRef-${message.id}`
                );
              }
            }}
            onLongPress={() => useAppStore.getState().setContextMenuShown(true)}
          >
            {children}
          </ReanimatedTouchableOpacity>
          {!message.hasNextMessageInSeries &&
            !isFrame &&
            !isAttachment &&
            !isTransaction &&
            (Platform.OS === "ios" || Platform.OS === "web") && (
              <MessageTail
                style={highlightingMessage ? iosAnimatedTailStyle : undefined}
                fromMe={message.fromMe}
                colorScheme={colorScheme}
                hideBackground={hideBackground}
              />
            )}
        </ContextMenu>
      </GestureDetector>
      {/* <View style={{width: 50, height: 20, backgroundColor: "red"}} />
      <GestureDetector gesture={composedGesture}>{children}</GestureDetector> */}
      <EmojiPicker
        onEmojiSelected={(e) => {
          if (!conversation) return;
          if (e.alreadySelected) {
            removeReactionFromMessage(conversation, message, e.emoji);
          } else {
            // We want to remove all emojis first
            const myReaction = reactions[userAddress];
            if (myReaction && myReaction.schema === "unicode") {
              removeReactionFromMessage(
                conversation,
                message,
                myReaction.content
              );
            }
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
    messageBubble: {
      flexShrink: 1,
      flexGrow: 0,
      minHeight: 36,
      borderRadius: 18,
    },

    messageBubbleMe: {
      marginLeft: "auto",
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
  });
};
