import Clipboard from "@react-native-clipboard/clipboard";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import Checkmark from "../../assets/checkmark.svg";
import Clock from "../../assets/clock.svg";
import Exclamationmark from "../../assets/exclamationmark.triangle.svg";
import {
  useAccountsStore,
  useTransactionsStore,
} from "../../data/store/accountsStore";
import {
  getCoinbaseTransactionDetails,
  getTransactionDetails,
} from "../../utils/api";
import {
  actionSheetColors,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { converseEventEmitter } from "../../utils/events";
import { shortAddress } from "../../utils/str";
import {
  TransactionContentType,
  TransactionDetails,
  TransactionEvent,
  createUniformTransaction,
  extractChainIdToHex,
  getTransactionType,
  useTransactionForMessage,
} from "../../utils/transaction";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

const TransactionView = ({
  fromMe,
  children,
}: {
  fromMe: boolean;
  children: React.ReactNode;
}) => {
  const styles = useStyles();
  return (
    <>
      <View
        style={[styles.innerBubble, fromMe ? styles.innerBubbleMe : undefined]}
      >
        {children}
      </View>
    </>
  );
};

const TransactionStatusView = ({
  fromMe,
  transactionDisplay,
  status,
  colorScheme,
}: {
  fromMe: boolean;
  transactionDisplay: string;
  status?: "PENDING" | "FAILURE" | "SUCCESS";
  colorScheme: ColorSchemeName;
}) => {
  const styles = useStyles();
  const StatusIcon =
    status === "FAILURE"
      ? Exclamationmark
      : status === "SUCCESS"
      ? Checkmark
      : Clock;
  const statusText =
    status === "PENDING"
      ? "Pending"
      : status === "FAILURE"
      ? "Failed"
      : status === "SUCCESS"
      ? "Success"
      : "Loading";

  return (
    <>
      <View style={styles.transactionDetailsContainer}>
        <View style={styles.centeredStatusContainer}>
          <Text
            style={[
              styles.text,
              styles.transactionDetails,
              fromMe ? styles.textMe : undefined,
            ]}
          >
            {transactionDisplay}
          </Text>
          <StatusIcon
            style={styles.statusIcon}
            fill={fromMe ? "white" : textSecondaryColor(colorScheme)}
            width={15}
            height={15}
          />
          <Text
            style={[
              styles.text,
              styles.transactionDetails,
              fromMe ? styles.textMe : undefined,
            ]}
          >
            {statusText}
          </Text>
        </View>
      </View>
    </>
  );
};

export default function ChatTransactionReference({ message }: Props) {
  const colorScheme = useColorScheme();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const styles = useStyles();
  const [transaction, setTransaction] = useState({
    loading: true,
    error: false,
    id: "", // "[networkid]-[txHash | sponsoredTxId]", see helper: getTxRefId()
    transactionType: undefined as TransactionContentType | undefined,
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
  const setTransactions = useTransactionsStore((s) => s.setTransactions);

  const { transactionDisplay, amountToDisplay, txLookup } =
    useTransactionForMessage(message, currentAccount);

  useEffect(() => {
    setTransaction((t) => ({
      ...t,
      error: false,
      loading: false,
      ...txLookup,
    }));
  }, [txLookup]);

  const showTransactionActionSheet = useCallback(() => {
    const options = ["Copy transaction hash", "Cancel"];
    const methods: { [key: string]: () => void } = {
      "Copy transaction hash": () => Clipboard.setString(transaction.reference),
    };
    if (transaction.blockExplorerURL) {
      options.unshift("See in block explorer");
      methods["See in block explorer"] = () =>
        Linking.openURL(transaction.blockExplorerURL!);
    }
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.indexOf("Cancel"),
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const selectedOption = options[selectedIndex];
        const method = methods[selectedOption];
        if (method) {
          method();
        }
      }
    );
  }, [transaction.reference, transaction.blockExplorerURL, colorScheme]);

  useEffect(() => {
    const eventHandler = `showActionSheetForTxRef-${message.id}`;
    converseEventEmitter.on(eventHandler, showTransactionActionSheet);
    return () => {
      converseEventEmitter.off(eventHandler, showTransactionActionSheet);
    };
  }, [message.id, showTransactionActionSheet]);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    const txRef = JSON.parse(message.content);
    const txType = getTransactionType(txRef);

    const go = async () => {
      if (fetchingTransaction.current) return;
      fetchingTransaction.current = true;
      setTransaction((t) => ({ ...t, loading: true }));

      let txDetails: TransactionDetails | undefined;

      try {
        switch (txType) {
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
          const uniformTx = createUniformTransaction(txRef, txDetails);
          setTransaction((t) => ({
            ...t,
            error: false,
            loading: false,
            ...uniformTx,
          }));

          retryTimeout = setTimeout(go, 5000);
        } else if (txDetails) {
          const uniformTx = createUniformTransaction(txRef, txDetails);
          console.log("Updating transaction in Zustand", uniformTx.reference);

          // Update zustand transaction store
          setTransactions({
            [uniformTx.id]: uniformTx,
          });

          // Update component state
          setTransaction((t) => ({
            ...t,
            error: false,
            loading: false,
            ...uniformTx,
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

    // Cleanup on unmount or dependency change
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [currentAccount, message, setTransactions, txLookup]);

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );

  // Converse sponsored transaction
  if (transaction.sponsored || transaction.status !== "PENDING") {
    return (
      <>
        <TransactionView fromMe={message.fromMe}>
          <Text
            style={[
              styles.text,
              styles.amount,
              message.fromMe ? styles.textMe : undefined,
            ]}
          >
            {amountToDisplay}
          </Text>
          <TransactionStatusView
            fromMe={message.fromMe}
            transactionDisplay={transactionDisplay}
            status={transaction.status}
            colorScheme={colorScheme}
          />
        </TransactionView>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else {
    return (
      <>
        <TransactionView fromMe={message.fromMe}>
          <Text style={[styles.text, styles.bold]}>Transaction</Text>
          <Text style={[styles.text, styles.small]}>
            Blockchain: {transaction.chainName}
          </Text>
          <Text style={[styles.text, styles.small]}>
            Transaction hash: {shortAddress(transaction.reference)}
          </Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.text, styles.small]}>Status:</Text>
            <Clock
              style={styles.statusIcon}
              fill={textSecondaryColor(colorScheme)}
              width={15}
              height={15}
            />
            <Text style={[styles.text, styles.small]}>Pending</Text>
          </View>
        </TransactionView>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  }
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    transactionDetailsContainer: {
      flexDirection: "column",
      width: "100%",
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    centeredStatusContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 100,
    },
    transactionDetails: {
      fontSize: 16,
      color: textSecondaryColor(colorScheme),
    },
    text: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    textMe: {
      color: "white",
    },
    amount: {
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
    },
    bold: {
      fontWeight: "bold",
    },
    small: {
      fontSize: 15,
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
    statusIcon: {
      marginHorizontal: -4,
    },
  });
};
