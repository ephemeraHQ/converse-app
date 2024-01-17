import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  getTransactionsStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import {
  getCoinbaseTransactionDetails,
  getTransactionDetails,
} from "../../utils/api";
import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import {
  TransactionDetails,
  TransactionEvent,
  createUniformTransaction,
  extractChainIdToHex,
  formatAmount,
  getTxContentType,
  getTxRefId,
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
    id: "", // "[networkid]-[txHash | sponsoredTxId]", see helper: getTxRefId()
    contentType: undefined as
      | undefined
      | "transactionReference"
      | "coinbaseRegular"
      | "coinbaseSponsored",
    namespace: undefined as undefined | string,
    networkId: "" as string | number,
    reference: "",
    metadata: undefined as undefined | object,
    status: undefined as undefined | "PENDING" | "FAILURE" | "SUCCESS",
    sponsored: true, // by converse
    blockExplorerURL: undefined as undefined | string,
    chainName: undefined as undefined | string,
    events: [] as TransactionEvent[],
  });
  const fetchingTransaction = useRef(false);
  const showing = !transaction.loading;

  const saveAndDisplayTransaction = useCallback(
    (
      contentType:
        | "transactionReference"
        | "coinbaseRegular"
        | "coinbaseSponsored",
      txRef: TransactionReference,
      txRefId: string,
      txDetails: TransactionDetails,
      update = false
    ) => {
      if (txRef.namespace === "eip155" && txRef.networkId && txRef.reference) {
        const transactionStore = getTransactionsStore(currentAccount);
        const transaction = mergeTransactionRefData(
          contentType,
          txRef,
          txRefId,
          txDetails
        );
        transactionStore.getState().setTransactions([transaction]);
      }
    },
    [currentAccount]
  );

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const go = async () => {
      if (fetchingTransaction.current) return;
      fetchingTransaction.current = true;
      setTransaction((t) => ({ ...t, loading: true }));

      const txRef = JSON.parse(message.content); // as TransactionReference;
      const txContentType = getTxContentType(txRef);
      let txDetails: TransactionDetails | undefined;

      try {
        switch (txContentType) {
          case "transactionReference": {
            txDetails = await getTransactionDetails(
              currentAccount,
              txRef.networkId,
              txRef.reference
            );
            break;
          }
          case "coinbaseRegular": {
            txDetails = await getTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.network.rawValue),
              txRef.transactionHash
            );
            break;
          }
          case "coinbaseSponsored": {
            txDetails = await getCoinbaseTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.network.rawValue),
              txRef.sponsoredTxId
            );
            break;
          }
          default: {
            console.error("Invalid transaction content type");
            break;
          }
        }

        if (txDetails && txDetails.status === "PENDING") {
          console.log("Transaction status is PENDING, retrying...");
          retryTimeout = setTimeout(go, 5000);
        } else if (txDetails) {
          const uniformTx = createUniformTransaction(txRef, txDetails);
          console.log("Updating transaction in Zustand", uniformTx.reference);

          // Update transaction store
          const transactionStore = getTransactionsStore(currentAccount);
          transactionStore.getState().setTransactions([uniformTx]);

          setTransaction((t) => ({
            ...t,
            error: false,
            loading: false,
            uniformTx,
          }));
        } else {
          console.error("Transaction details could not be fetched");
        }
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        // Let's retry in case of network error
        retryTimeout = setTimeout(go, 5000);
      } finally {
        fetchingTransaction.current = false;
      }
    };

    const txRef = JSON.parse(message.content);
    const txContentType = getTxContentType(txRef);
    if (txContentType) {
      const txLookup = getTransactionsStore(currentAccount)
        .getState()
        .getTransaction(getTxRefId(txRef, txContentType));

      if (!txLookup || txLookup.status === "PENDING") {
        go();
      } else {
        setTransaction((t) => ({
          ...t,
          error: false,
          loading: false,
          ...txLookup,
        }));
      }
    } else {
      // sentryTrackMessage("INVALID_TRANSACTION_REFERENCE", { message });
      // TODO: should display message fallback if no valid transaction content type is found
      setTransaction((a) => ({ ...a, error: true, loading: false }));
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [currentAccount, message]);

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
    // TODO – WIP check for "transfer" events that contains an amount
  } else if (
    transaction.status === "SUCCESS" ||
    transaction.status === "FAILURE"
  ) {
    return (
      <>
        <View
          style={[
            styles.innerBubble,
            message.fromMe ? styles.innerBubbleMe : undefined,
          ]}
        >
          <Text style={styles.amount}>
            {formatAmount(transaction.events[0])}
          </Text>
          <Text style={textStyle}>{transaction.chainName}</Text>
          <Text style={textStyle}>Status: {transaction.status}</Text>
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
    amount: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
      color: textPrimaryColor(colorScheme),
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
