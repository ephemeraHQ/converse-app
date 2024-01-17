import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  getTransactionsStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { getTransactionDetails } from "../../utils/api";
import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import {
  TransactionDetails,
  mergeTransactionRefData,
} from "../../utils/transaction";
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
    namespace: undefined as undefined | string,
    networkId: "",
    reference: "",
    metadata: undefined as undefined | object,
    status: undefined as undefined | "PENDING" | "FAILURE" | "SUCCESS",
    sponsored: true, // by converse
    blockExplorerURL: undefined as undefined | string,
    events: undefined as undefined | [],
  });
  const fetchingTransaction = useRef(false);
  const showing = !transaction.loading;

  const saveAndDisplayTransaction = useCallback(
    (
      txId: string,
      txRef: TransactionReference,
      txDetails: TransactionDetails,
      update = false
    ) => {
      console.log("saveAndDisplayTransaction");

      if (txRef.namespace === "eip155" && txRef.networkId && txRef.reference) {
        const transactionStore = getTransactionsStore(currentAccount);
        const transaction = mergeTransactionRefData(txRef, txDetails);

        if (update) {
          transactionStore.getState().updateTransaction(txId, transaction);
        } else {
          transactionStore.getState().setTransactions([transaction]);
        }
      }
    },
    [currentAccount]
  );

  useEffect(() => {
    const go = async () => {
      if (fetchingTransaction.current) return;
      fetchingTransaction.current = true;
      setTransaction((t) => ({ ...t, loading: true }));

      const txRef = JSON.parse(message.content);
      const txId = `${txRef.networkId}-${txRef.reference}`;
      const txLookup = getTransactionsStore(currentAccount)
        .getState()
        .getTransaction(txId);

      if (!txLookup) {
        // TODO
        // Add the transaction since it's not found
        console.log("** TODO: Add the transaction since it's not found");

        try {
          const txDetails = await getTransactionDetails(
            currentAccount,
            txRef.networkId,
            txRef.reference
          );
          fetchingTransaction.current = false;
          saveAndDisplayTransaction(txId, txRef, txDetails);
        } catch (error) {
          fetchingTransaction.current = false;
          console.error("Error fetching or saving transaction details", error);
        }
      } else if (txLookup.status === "PENDING") {
        try {
          const txDetails = await getTransactionDetails(
            currentAccount,
            txRef.networkId,
            txRef.reference
          );

          if (txDetails.status !== "PENDING") {
            // TODO
            // Update the transaction in the store
            console.log("** TODO: Update the transaction in the store");

            // save and display
            fetchingTransaction.current = false;
            saveAndDisplayTransaction(txId, txRef, txDetails, true);
          } else {
            // Retry after 5 seconds if still pending
            console.log("** Retrying");
            setTimeout(go, 5000);
          }
        } catch (error) {
          fetchingTransaction.current = false;
          console.error("Error fetching transaction details", error);
        }
      } else if (
        txLookup.status === "SUCCESS" ||
        txLookup.status === "FAILURE"
      ) {
        // Do nothing as it's already saved
      }
    };

    const isTxRefValid = isTransactionRefValid(message.content);
    if (!isTxRefValid) {
      // sentryTrackMessage("INVALID_TRANSACTION_REFERENCE", { message });
      setTransaction((a) => ({ ...a, error: true, loading: false }));
    } else {
      go();
    }
  }, [currentAccount, message, saveAndDisplayTransaction]);

  const textStyle = [
    styles.text,
    { color: message.fromMe ? "white" : textPrimaryColor(colorScheme) },
  ];

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );

  // Conditional rendering
  if (transaction.loading) {
    return (
      <>
        <View
          style={[
            styles.innerBubble,
            message.fromMe ? styles.innerBubbleMe : undefined,
          ]}
        >
          <Text style={textStyle}>Loading...</Text>
        </View>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (transaction.error) {
    return null;
  } else {
    return (
      <>
        <View
          style={[
            styles.innerBubble,
            message.fromMe ? styles.innerBubbleMe : undefined,
          ]}
        >
          <Text style={textStyle}>{message.content}</Text>
        </View>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  }
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
