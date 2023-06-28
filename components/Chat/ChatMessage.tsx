import * as Clipboard from "expo-clipboard";
import { ReactNode, useCallback, useContext } from "react";
import {
  Alert,
  View,
  useColorScheme,
  ColorSchemeName,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";

import MessageTail from "../../assets/message-tail.svg";
import { AppContext } from "../../data/store/context";
import { XmtpDispatchTypes, XmtpMessage } from "../../data/store/xmtpReducer";
import { blockPeer, reportMessage } from "../../utils/api";
import {
  actionSheetColors,
  messageBubbleColor,
  myMessageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getRelativeDate } from "../../utils/date";
import ClickableText from "../ClickableText";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import ChatAttachmentPreview from "./ChatAttachementPreview";
import ChatMessageMetadata from "./ChatMessageMetadata";

export type MessageToDisplay = XmtpMessage & {
  hasPreviousMessageInSeries: boolean;
  hasNextMessageInSeries: boolean;
  dateChange: boolean;
  fromMe: boolean;
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
        Clipboard.setStringAsync(message.content);
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
        title: message.content,
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
    message.content,
    showMessageReportActionSheet,
  ]);

  const metadata = (
    <ChatMessageMetadata message={message} white={message.fromMe} />
  );
  const isAttachment = message.contentType.startsWith(
    "xmtp.org/remoteStaticAttachment:"
  );
  let messageContent: ReactNode;
  if (isAttachment) {
    messageContent = <ChatAttachmentPreview message={message} />;
  } else {
    messageContent = (
      <ClickableText
        style={[
          styles.messageText,
          message.fromMe ? styles.messageTextMe : undefined,
        ]}
      >
        {message.content}
        <View style={{ opacity: 0 }}>{metadata}</View>
      </ClickableText>
    );
  }

  return (
    <View
      style={[
        styles.messageRow,
        { marginBottom: !message.hasNextMessageInSeries ? 8 : 2 },
      ]}
    >
      {message.dateChange && (
        <Text style={styles.date}>{getRelativeDate(message.sent)}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.messageBubble,
          isAttachment
            ? styles.messageBubbleAttachment
            : styles.messageBubbleText,
          message.fromMe ? styles.messageBubbleMe : undefined,
          Platform.select({
            default: {},
            android: {
              // Messages not from me
              borderBottomLeftRadius:
                !message.fromMe && message.hasNextMessageInSeries ? 2 : 18,
              borderTopLeftRadius:
                !message.fromMe && message.hasPreviousMessageInSeries ? 2 : 18,
              // Messages from me
              borderBottomRightRadius:
                message.fromMe && message.hasNextMessageInSeries ? 2 : 18,
              borderTopRightRadius:
                message.fromMe && message.hasPreviousMessageInSeries ? 2 : 18,
            },
          }),
        ]}
        activeOpacity={1}
        onLongPress={isAttachment ? undefined : showMessageActionSheet}
      >
        {messageContent}
        <View style={styles.metadataContainer}>{metadata}</View>

        {!message.hasNextMessageInSeries && Platform.OS === "ios" && (
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
      flexDirection: "row",
      paddingHorizontal: Platform.OS === "android" ? 10 : 20,
      flexWrap: "wrap",
    },
    date: {
      flexBasis: "100%",
      textAlign: "center",
      fontSize: 11,
      color: textSecondaryColor(colorScheme),
      marginTop: 12,
      marginBottom: 8,
    },
    messageBubble: {
      flexShrink: 1,
      flexGrow: 0,
      maxWidth: "80%",
      minHeight: 36,
      backgroundColor: messageBubbleColor(colorScheme),
      borderRadius: 18,
    },
    messageBubbleText: {
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "android" ? 6 : 7,
    },
    messageBubbleAttachment: {
      padding: 4,
    },
    messageBubbleMe: {
      marginLeft: "auto",
      backgroundColor: myMessageBubbleColor(colorScheme),
    },
    messageText: {
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    messageTextMe: {
      color: "white",
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
    metadataContainer: {
      position: "absolute",
      bottom: 6,
      right: 12,
    },
  });
