import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import { useAccountsStore } from "../../data/store/accountsStore";
import { getTransactionDetails } from "../../utils/api";
import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import { sentryTrackMessage } from "../../utils/sentry";
import { TransactionReference } from "../../utils/xmtpRN/contentTypes/transactionReference";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

export default function ChatTransactionReference({ message }: Props) {
  const colorScheme = useColorScheme();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const styles = useStyles();

  const [transaction, setTransaction] = useState({
    loading: true,
    error: false,
    id: "", // Concatenation of "[networkid]-[reference]"
    contentType: undefined as
      | undefined
      | "transactionReference"
      | "coinbaseRegular"
      | "coinbaseSponsored",
    createdAt: 0,
    updatedAt: 0,
    namespace: undefined as undefined | string,
    networkId: "",
    reference: "",
    metadata: undefined as undefined | object,
    status: undefined as undefined | "PENDING" | "FAILURE" | "SUCCESS",
    sponsored: true, // by converse
    blockExplorerURL: undefined as undefined | string,
    events: undefined as undefined | [],
  });

  // TODO saveAndDisplayTransaction
  // TODO fetchTransactionDetails
  // TODO openInWebview

  const fetchingTransactionRef = useRef(false);

  useEffect(() => {
    const go = async () => {
      const parsedMessageContent: TransactionReference = JSON.parse(
        message.content
      );
      const transactionDetails = await getTransactionDetails(
        currentAccount,
        parsedMessageContent.networkId as string,
        parsedMessageContent.reference
      );
    };

    if (!message.content) {
      sentryTrackMessage("EMPTY_TRANSACTION", { message });
      setTransaction((a) => ({ ...a, error: true, loading: false }));
    } else {
      go();
    }
  }, [currentAccount, message]);

  const showing = !transaction.loading;

  const textStyle = [
    styles.text,
    { color: message.fromMe ? "white" : textPrimaryColor(colorScheme) },
  ];

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );

  return (
    <>
      <View
        style={[
          styles.innerBubble,
          message.fromMe ? styles.innerBubbleMe : undefined,
        ]}
      >
        <Text style={textStyle}>Test Content Inner</Text>
      </View>
      <View style={{ opacity: 0 }}>{metadataView}</View>
    </>
  );
}

// TODO UPDATE STYLE
const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    imagePreview: {
      borderRadius: 14,
      width: "100%",
      zIndex: 1,
    },
    text: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    innerBubble: {
      backgroundColor: messageInnerBubbleColor(colorScheme),
      borderRadius: 14,
      width: "100%",
      paddingHorizontal: 2,
      paddingVertical: 6,
      marginBottom: 5,
    },
    innerBubbleMe: {
      backgroundColor: myMessageInnerBubbleColor(colorScheme),
    },
    metadataContainer: {
      position: "absolute",
      bottom: 6,
      right: 12,
      backgroundColor: "rgba(24, 24, 24, 0.5)",
      borderRadius: 18,
      paddingLeft: 1,
      paddingRight: 2,
      zIndex: 2,
      ...Platform.select({
        default: {
          paddingBottom: 1,
          paddingTop: 1,
        },
        android: { paddingBottom: 3, paddingTop: 2 },
      }),
    },
  });
};
