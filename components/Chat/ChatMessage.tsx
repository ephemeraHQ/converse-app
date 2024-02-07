import { ReactNode } from "react";
import {
  View,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  ColorSchemeName,
  DimensionValue,
} from "react-native";

import MessageTail from "../../assets/message-tail.svg";
import { XmtpMessage } from "../../data/store/chatStore";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import {
  messageBubbleColor,
  myMessageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getRelativeDate } from "../../utils/date";
import { isDesktop } from "../../utils/device";
import { LimitedMap } from "../../utils/objects";
import { getMessageReactions } from "../../utils/reactions";
import { isTransactionMessage } from "../../utils/transaction";
import {
  getMessageContentType,
  isContentType,
} from "../../utils/xmtpRN/contentTypes";
import ClickableText from "../ClickableText";
import ChatAttachmentBubble from "./ChatAttachmentBubble";
import ChatMessageActions from "./ChatMessageActions";
import ChatMessageFramePreviews from "./ChatMessageFramePreviews";
import ChatMessageMetadata from "./ChatMessageMetadata";
import ChatMessageReactions from "./ChatMessageReactions";
import ChatTransactionReference from "./ChatTransactionReference";

export type MessageToDisplay = XmtpMessage & {
  hasPreviousMessageInSeries: boolean;
  hasNextMessageInSeries: boolean;
  dateChange: boolean;
  fromMe: boolean;
};

type Props = {
  account: string;
  message: MessageToDisplay;
  colorScheme: ColorSchemeName;
};

function ChatMessage({ message, colorScheme }: Props) {
  const styles = useStyles();

  const metadata = (
    <ChatMessageMetadata message={message} white={message.fromMe} />
  );

  let messageContent: ReactNode;
  const contentType = getMessageContentType(message.contentType);
  switch (contentType) {
    case "attachment":
    case "remoteAttachment":
      messageContent = <ChatAttachmentBubble message={message} />;
      break;
    case "transactionReference":
    case "coinbasePayment":
      messageContent = <ChatTransactionReference message={message} />;
      break;
    default:
      messageContent = (
        <ClickableText
          style={[
            styles.messageText,
            message.fromMe ? styles.messageTextMe : undefined,
          ]}
        >
          {message.content || message.contentFallback}
          <View style={{ opacity: 0 }}>{metadata}</View>
        </ClickableText>
      );
      break;
  }

  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const reactions = getMessageReactions(message);

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
      messageMaxWidth = "85%";
    }
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

      <ChatMessageActions
        message={message}
        reactions={reactions}
        style={[
          styles.messageBubble,
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
          {
            maxWidth: messageMaxWidth,
          },
        ]}
      >
        {isContentType("text", message.contentType) && (
          <ChatMessageFramePreviews message={message} />
        )}

        <View
          style={[
            isAttachment || isTransaction
              ? styles.messageBubbleAttachmentOrTransaction
              : styles.messageBubbleText,
          ]}
        >
          {messageContent}
        </View>

        <View style={styles.metadataContainer}>{metadata}</View>

        {!message.hasNextMessageInSeries &&
          (Platform.OS === "ios" || Platform.OS === "web") && (
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
      </ChatMessageActions>
      <ChatMessageReactions message={message} reactions={reactions} />
    </View>
  );
}

// We use a cache for chat messages so that it doesn't rerender too often.
// Indeed, since we use an inverted FlashList for chat, when a new message
// arrives it is pushed at the BEGINNING of the array, and FlashList internals
// rerenders a bunch of messages which can have an impact on performance.
// With this LimitedMap we keep 50 rendered messages in RAM for better perf.

type RenderedChatMessage = {
  renderedMessage: JSX.Element;
  message: MessageToDisplay;
  colorScheme: ColorSchemeName;
};

const renderedMessages = new LimitedMap<string, RenderedChatMessage>(50);

export default function CachedChatMessage({
  account,
  message,
  colorScheme,
}: Props) {
  const keysChangesToRerender: (keyof MessageToDisplay)[] = [
    "id",
    "sent",
    "status",
    "lastUpdateAt",
    "dateChange",
    "hasNextMessageInSeries",
    "hasPreviousMessageInSeries",
  ];
  const alreadyRenderedMessage = renderedMessages.get(
    `${account}-${message.id}`
  );
  const shouldRerender =
    !alreadyRenderedMessage ||
    alreadyRenderedMessage.colorScheme !== colorScheme ||
    keysChangesToRerender.some(
      (k) => message[k] !== alreadyRenderedMessage.message[k]
    );
  if (shouldRerender) {
    const renderedMessage = ChatMessage({ account, message, colorScheme });
    renderedMessages.set(`${account}-${message.id}`, {
      message,
      renderedMessage,
      colorScheme,
    });
    return renderedMessage;
  } else {
    return alreadyRenderedMessage.renderedMessage;
  }
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
      minHeight: 36,
      backgroundColor: messageBubbleColor(colorScheme),
      borderRadius: 18,
    },
    messageBubbleText: {
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "android" ? 6 : 7,
    },
    messageBubbleAttachmentOrTransaction: {
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
};
