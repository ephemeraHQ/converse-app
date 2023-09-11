import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ColorSchemeName,
  Platform,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
  useColorScheme,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import {
  currentAccount,
  useSettingsStore,
  useUserStore,
} from "../../data/store/accountsStore";
import { blockPeer, reportMessage } from "../../utils/api";
import { isAttachmentMessage } from "../../utils/attachment";
import { actionSheetColors } from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import {
  MessageReaction,
  addReactionToMessage,
  getEmojiName,
  removeReactionFromMessage,
} from "../../utils/reactions";
import EmojiPicker from "../../vendor/rn-emoji-keyboard";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  children: React.ReactNode;
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
  style: StyleProp<ViewStyle>;
};

export default function ChatMessageActions({
  children,
  message,
  reactions,
  style,
}: Props) {
  const { conversation } = useConversationContext(["conversation"]);
  const isAttachment = isAttachmentMessage(message.contentType);
  const colorScheme = useColorScheme();
  const userAddress = useUserStore((s) => s.userAddress);
  const setBlockedPeerStatus = useSettingsStore((s) => s.setBlockedPeerStatus);

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
    blockPeer({
      peerAddress: message.senderAddress,
      blocked: true,
      account: currentAccount(),
    });
    setBlockedPeerStatus(message.senderAddress, true);
  }, [
    message.content,
    message.id,
    message.senderAddress,
    setBlockedPeerStatus,
  ]);

  const showMessageReportActionSheet = useCallback(() => {
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

  const canAddReaction =
    message.status !== "sending" && message.status !== "error";

  const showMessageActionSheet = useCallback(() => {
    const methods: any = {};
    if (canAddReaction) {
      methods["Add a reaction"] = showReactionModal;
    }
    if (!isAttachment) {
      methods["Copy message"] = () => {
        Clipboard.setStringAsync(message.content);
      };
      if (!message.fromMe) {
        methods["Report message"] = showMessageReportActionSheet;
      }
    }

    methods.Cancel = () => {};

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: isAttachment ? "📎 Media" : message.content,
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
    colorScheme,
    isAttachment,
    message.content,
    message.fromMe,
    canAddReaction,
    showMessageReportActionSheet,
    showReactionModal,
  ]);

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
          if (isAttachment || !canAddReaction) return;
          showReactionModal();
        })
        .runOnJS(true),
    [canAddReaction, isAttachment, showReactionModal]
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

  // We use a mix of Gesture Detector AND TouchableOpacity
  // because GestureDetector is better for dual tap but if
  // we add the gesture detector for long press the long press
  // in the parsed text stops working (https://github.com/software-mansion/react-native-gesture-handler/issues/867)

  return (
    <>
      <GestureDetector gesture={doubleTapGesture}>
        <TouchableOpacity
          activeOpacity={1}
          style={style}
          onPress={() => {
            if (isAttachment) {
              // Transfering attachment opening intent to component
              converseEventEmitter.emit(
                `openAttachmentForMessage-${message.id}`
              );
            }
          }}
          onLongPress={showMessageActionSheet}
        >
          {children}
        </TouchableOpacity>
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
