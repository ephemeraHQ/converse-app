import * as Clipboard from "expo-clipboard";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  ColorSchemeName,
  Platform,
  TouchableWithoutFeedback,
  useColorScheme,
} from "react-native";
import EmojiPicker from "rn-emoji-keyboard";

import { AppContext } from "../../data/deprecatedStore/context";
import { useSettingsStore, useUserStore } from "../../data/store/accountsStore";
import { blockPeer, reportMessage } from "../../utils/api";
import { isAttachmentMessage } from "../../utils/attachment";
import { actionSheetColors } from "../../utils/colors";
import { eventEmitter } from "../../utils/events";
import {
  MessageReaction,
  addReactionToMessage,
  getEmojiName,
  removeReactionFromMessage,
} from "../../utils/reactions";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  children: React.ReactNode;
  message: MessageToDisplay;
  sendMessage: (
    content: string,
    contentType?: string,
    contentFallback?: string
  ) => Promise<void>;
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
};

export default function ChatMessageActions({
  children,
  message,
  sendMessage,
  reactions,
}: Props) {
  const isAttachment = isAttachmentMessage(message.contentType);
  const colorScheme = useColorScheme();
  const { dispatch } = useContext(AppContext);
  const userAddress = useUserStore((s) => s.userAddress);
  const setBlockedPeerStatus = useSettingsStore((s) => s.setBlockedPeerStatus);

  const report = useCallback(async () => {
    reportMessage({
      messageId: message.id,
      messageContent: message.content,
      messageSender: message.senderAddress,
    });

    Alert.alert("Message reported");
  }, [message]);

  const reportAndBlock = useCallback(async () => {
    reportMessage({
      messageId: message.id,
      messageContent: message.content,
      messageSender: message.senderAddress,
    });
    blockPeer({ peerAddress: message.senderAddress, blocked: true });
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

  const lastPressMessage = useRef(0);
  const onPressMessage = useCallback(() => {
    if (isAttachment) {
      // Transfering attachment opening intent to component
      eventEmitter.emit(`openAttachmentForMessage-${message.id}`);
      return;
    }
    if (!canAddReaction) return;
    const now = new Date().getTime();
    const sinceLastPress = now - lastPressMessage.current;
    if (sinceLastPress < 500) {
      // Double dap!
      showReactionModal();
    }
    lastPressMessage.current = now;
  }, [canAddReaction, isAttachment, message.id, showReactionModal]);

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

  return (
    <>
      <TouchableWithoutFeedback
        onPress={onPressMessage}
        onLongPress={showMessageActionSheet}
      >
        {children}
      </TouchableWithoutFeedback>
      <EmojiPicker
        onEmojiSelected={(e) => {
          if (e.alreadySelected) {
            removeReactionFromMessage(message, e.emoji, sendMessage);
          } else {
            // We want to remove all emojis first
            const myReaction = reactions[userAddress];
            if (myReaction && myReaction.schema === "unicode") {
              removeReactionFromMessage(
                message,
                myReaction.content,
                sendMessage
              );
            }
            addReactionToMessage(message, e.emoji, sendMessage);
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
          containerActive: "#766dfc",
        },
      };
