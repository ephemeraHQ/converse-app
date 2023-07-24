import { ReactNode } from "react";
import {
  View,
  useColorScheme,
  ColorSchemeName,
  StyleSheet,
  Text,
  Platform,
} from "react-native";

import MessageTail from "../../assets/message-tail.svg";
import { XmtpMessage } from "../../data/store/xmtpReducer";
import { isAttachmentMessage } from "../../utils/attachment";
import {
  messageBubbleColor,
  myMessageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getRelativeDate } from "../../utils/date";
import { getMessageReactions } from "../../utils/reactions";
import ClickableText from "../ClickableText";
import ChatAttachmentBubble from "./ChatAttachmentBubble";
import ChatMessageActions from "./ChatMessageActions";
import ChatMessageMetadata from "./ChatMessageMetadata";
import ChatMessageReactions from "./ChatMessageReactions";

export type MessageToDisplay = XmtpMessage & {
  hasPreviousMessageInSeries: boolean;
  hasNextMessageInSeries: boolean;
  dateChange: boolean;
  fromMe: boolean;
};

type Props = {
  message: MessageToDisplay;
  sendMessage: (
    content: string,
    contentType?: string,
    contentFallback?: string
  ) => Promise<void>;
};

export default function ChatMessage({ message, sendMessage }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const metadata = (
    <ChatMessageMetadata message={message} white={message.fromMe} />
  );
  const isAttachment = isAttachmentMessage(message.contentType);
  let messageContent: ReactNode;
  if (isAttachment) {
    messageContent = <ChatAttachmentBubble message={message} />;
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

  const reactions = getMessageReactions(message);

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

      <ChatMessageActions
        message={message}
        sendMessage={sendMessage}
        reactions={reactions}
      >
        <View
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
        </View>
      </ChatMessageActions>
      <ChatMessageReactions
        message={message}
        reactions={reactions}
        sendMessage={sendMessage}
      />
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
