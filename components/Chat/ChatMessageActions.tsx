import * as Clipboard from "expo-clipboard";
import { useCallback, useContext, useState } from "react";
import { Alert, useColorScheme } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { AppContext } from "../../data/store/context";
import { XmtpDispatchTypes } from "../../data/store/xmtpReducer";
import { blockPeer, reportMessage } from "../../utils/api";
import { actionSheetColors } from "../../utils/colors";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  children: React.ReactNode;
  message: MessageToDisplay;
  sendMessage: (content: string, contentType?: string) => Promise<void>;
};

export default function ChatMessageActions({
  children,
  message,
  sendMessage,
}: Props) {
  const isAttachment = message.contentType.startsWith(
    "xmtp.org/remoteStaticAttachment:"
  );
  const colorScheme = useColorScheme();
  const { dispatch } = useContext(AppContext);

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
    dispatch({
      type: XmtpDispatchTypes.XmtpSetBlockedStatus,
      payload: { peerAddress: message.senderAddress, blocked: true },
    });
  }, [message, dispatch]);

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

  const showMessageActionSheet = useCallback(() => {
    const methods: any = {
      //   "Add a reaction": () => {
      //     sendMessage(
      //       JSON.stringify({
      //         reference: message.id,
      //         action: "added",
      //         content: "😅",
      //         schema: "unicode",
      //       }),
      //       ContentTypeReaction.toString()
      //     );
      //   },
      "Add a reaction": showReactionModal,
    };
    if (!isAttachment) {
      methods["Copy message"] = () => {
        Clipboard.setStringAsync(message.content);
      };
    }
    if (!message.fromMe) {
      methods["Report message"] = showMessageReportActionSheet;
    }
    methods.Cancel = () => {};

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: isAttachment ? "Image" : message.content,
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: message.fromMe ? undefined : 1,
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
    showMessageReportActionSheet,
    showReactionModal,
  ]);
  const doubleTapOnMessage = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(showReactionModal)();
    });

  const longPressOnMessage = Gesture.LongPress().onStart(() => {
    runOnJS(showMessageActionSheet)();
  });
  const doubleTapOrLongPressOnMessage = Gesture.Simultaneous(
    doubleTapOnMessage,
    longPressOnMessage
  );
  return (
    <>
      <GestureDetector
        gesture={
          isAttachment ? doubleTapOnMessage : doubleTapOrLongPressOnMessage
        }
      >
        {children}
      </GestureDetector>
    </>
  );
}
