import * as Clipboard from "expo-clipboard";
import { useCallback, useContext } from "react";
import {
  Alert,
  View,
  useColorScheme,
  ColorSchemeName,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import Checkmark from "../../assets/checkmark.svg";
import Clock from "../../assets/clock.svg";
import MessageTail from "../../assets/message-tail.svg";
import { AppContext } from "../../data/store/context";
import { XmtpDispatchTypes, XmtpMessage } from "../../data/store/xmtpReducer";
import { blockPeer, reportMessage } from "../../utils/api";
import {
  actionSheetColors,
  messageBubbleColor,
  myMessageBubbleColor,
  textSecondaryColor,
} from "../../utils/colors";
import ClickableText from "../ClickableText";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";

export type MessageToDisplay = XmtpMessage & {
  lastMessageInSeries: boolean;
  fromMe: boolean;
  sentViaConverse: boolean;
  messageToDisplay: string;
};

type Props = {
  message: MessageToDisplay;
};

export default function ChatMessage({ message }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

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

  const showMessageActionSheet = useCallback(() => {
    const methods: any = {
      "Copy message": () => {
        Clipboard.setStringAsync(message.messageToDisplay);
      },
    };
    if (!message.fromMe) {
      methods["Report message"] = showMessageReportActionSheet;
    }
    methods.Cancel = () => {};

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: message.messageToDisplay,
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
    message.fromMe,
    message.messageToDisplay,
    showMessageReportActionSheet,
  ]);

  const metadata = (
    <View style={styles.metadata}>
      {message.fromMe &&
        (message.status === "sending" ? (
          <Clock
            style={styles.statusIcon}
            fill={textSecondaryColor(colorScheme)}
            width={12}
            height={12}
          />
        ) : (
          <Checkmark
            style={styles.statusIcon}
            fill={textSecondaryColor(colorScheme)}
            width={10}
            height={10}
          />
        ))}
    </View>
  );

  return (
    <View style={styles.messageRow}>
      <TouchableOpacity
        style={[
          styles.messageBubble,
          message.fromMe ? styles.messageBubbleMe : undefined,
        ]}
        activeOpacity={1}
        onLongPress={showMessageActionSheet}
      >
        <ClickableText>
          {message.messageToDisplay}
          <View style={{ opacity: 0 }}>{metadata}</View>
        </ClickableText>
        <View style={styles.metadataContainer}>{metadata}</View>

        {message.lastMessageInSeries && (
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
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    messageRow: {
      borderWidth: 1,
      flexDirection: "row",
      padding: 10,
    },
    messageBubble: {
      flexShrink: 1,
      flexGrow: 0,
      paddingHorizontal: 12,
      paddingVertical: 6,
      maxWidth: "80%",
      backgroundColor: messageBubbleColor(colorScheme),
      borderRadius: 18,
    },
    messageBubbleMe: {
      marginLeft: "auto",
      backgroundColor: myMessageBubbleColor(colorScheme),
    },
    messageTail: {
      position: "absolute",
      left: 0,
      bottom: 0,
      width: 14,
      height: 21,
      zIndex: -1,
    },
    messageTailMe: {
      left: "auto",
      right: 0,
      transform: [{ scaleX: -1 }],
    },
    metadataContainer: {
      position: "absolute",
      right: 12,
      bottom: 6,
    },
    metadata: {
      borderWidth: 0.5,
      paddingLeft: 10,
      height: 10,
      alignSelf: "flex-start",
    },
    statusIcon: {},
  });
