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
import { AppContext } from "../../data/store/context";
import { XmtpDispatchTypes, XmtpMessage } from "../../data/store/xmtpReducer";
import { blockPeer, reportMessage } from "../../utils/api";
import { actionSheetColors, textSecondaryColor } from "../../utils/colors";
import ClickableText from "../ClickableText";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";

type Props = {
  message: XmtpMessage;
  xmtpAddress?: string;
};

export default function ChatMessage({ message, xmtpAddress }: Props) {
  const isFromMe = !!xmtpAddress && xmtpAddress === message.senderAddress;
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
        Clipboard.setStringAsync(message.content);
      },
    };
    if (!isFromMe) {
      methods["Report message"] = showMessageReportActionSheet;
    }
    methods.Cancel = () => {};

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: message.content,
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: isFromMe ? undefined : 1,
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
  }, [colorScheme, isFromMe, message.content, showMessageReportActionSheet]);

  return (
    <View style={styles.messageRow}>
      <TouchableOpacity
        style={[
          styles.messageBubble,
          isFromMe ? styles.messageBubbleMe : undefined,
        ]}
        activeOpacity={1}
        onLongPress={showMessageActionSheet}
      >
        <ClickableText>{message.content}</ClickableText>
        {isFromMe &&
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
      padding: 10,
      maxWidth: "80%",
      backgroundColor: "pink",
      borderRadius: 10,
    },
    messageBubbleMe: {
      marginLeft: "auto",
    },
    statusIcon: {},
  });
