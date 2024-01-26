import Clipboard from "@react-native-clipboard/clipboard";
import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
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
  getTransactionsStore,
  useAccountsStore,
  useTransactionsStore,
} from "../../data/store/accountsStore";
import { Transaction } from "../../data/store/transactionsStore";
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
import { sentryTrackMessage } from "../../utils/sentry";
import { shortAddress } from "../../utils/str";
import {
  TransactionDetails,
  TransactionEvent,
  createUniformTransaction,
  extractChainIdToHex,
  formatAmount,
  getTransactionType,
  getTxRefId,
} from "../../utils/transaction";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
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
    transactionType: undefined as
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
  const showTransactionActionSheetRef = useRef<(() => void) | null>(null);
  const setTransactions = useTransactionsStore((s) => s.setTransactions);
  const txRef = JSON.parse(message.content); // as TransactionReference;

  useEffect(() => {
    const eventHandler = `showActionSheetForTxRef-${message.id}`;
    const showSheet = () => showTransactionActionSheetRef.current?.();

    converseEventEmitter.on(eventHandler, showSheet);

    return () => {
      converseEventEmitter.off(eventHandler, showSheet);
    };
  }, [message.id]);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    const txRef = JSON.parse(message.content); // as TransactionReference;
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

          retryTimeout = setTimeout(go, 10000);
        } else if (txDetails) {
          const uniformTx = createUniformTransaction(txRef, txDetails);
          console.log("Updating transaction in Zustand", uniformTx.reference);

          // Update zustand transaction store
          setTransactions([uniformTx]);

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
        retryTimeout = setTimeout(go, 10000);
      } finally {
        fetchingTransaction.current = false;
      }
    };

    if (txType) {
      const txLookup = getTransactionsStore(currentAccount)
        .getState()
        .getTransaction(getTxRefId(txRef, txType));

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
      sentryTrackMessage("INVALID_TRANSACTION_REFERENCE", { message });
      setTransaction((a) => ({ ...a, error: true, loading: false }));
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [currentAccount, message, setTransactions]);

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );

  const TransactionView = ({
    fromMe,
    children,
  }: {
    fromMe: boolean;
    children: React.ReactNode;
  }) => (
    <>
      <View
        style={[styles.innerBubble, fromMe ? styles.innerBubbleMe : undefined]}
      >
        {children}
      </View>
    </>
  );

  const TransactionStatusView = ({
    transactionDisplay,
    status,
    colorScheme,
  }: {
    transactionDisplay: string;
    status?: "PENDING" | "FAILURE" | "SUCCESS";
    colorScheme: ColorSchemeName; // Replace with appropriate type
  }) => {
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
                message.fromMe ? styles.textMe : undefined,
              ]}
            >
              {transactionDisplay}
            </Text>
            <StatusIcon
              style={styles.statusIcon}
              fill={message.fromMe ? "white" : textSecondaryColor(colorScheme)}
              width={15}
              height={15}
            />
            <Text
              style={[
                styles.text,
                styles.transactionDetails,
                message.fromMe ? styles.textMe : undefined,
              ]}
            >
              {statusText}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const getTransactionInfo = ({
    transaction,
    txRef,
  }: {
    transaction: Transaction;
    txRef: TransactionReference;
  }) => {
    let amount, currency, decimals;

    if (transaction.events && transaction.events.length > 0) {
      ({ amount, currency, decimals } = transaction.events[0]);
    } else if (txRef.metadata) {
      ({ amount, currency, decimals } = txRef.metadata);
    }

    const isUSDC = currency?.toLowerCase().includes("usd"); // USDC, USDT etc...
    const formattedAmountWithCurrencySymbol =
      amount && currency && decimals !== undefined
        ? formatAmount(amount, currency, decimals)
        : "–";
    const formattedAmount =
      amount && currency && decimals !== undefined
        ? formatAmount(amount, currency, decimals, false)
        : "–";

    const transactionDisplay = isUSDC
      ? `${formattedAmount} –`
      : `${transaction.chainName || "–"} –`;

    return {
      transactionDisplay,
      amountToDisplay: formattedAmountWithCurrencySymbol,
    };
  };

  const { transactionDisplay, amountToDisplay } = getTransactionInfo({
    transaction,
    txRef,
  });

  const openBlockExplorer = () => {
    if (transaction.blockExplorerURL) {
      Linking.openURL(transaction.blockExplorerURL);
    }
  };

  const copyTransactionHash = () => {
    Clipboard.setString(transaction.reference);
  };

  showTransactionActionSheetRef.current = () => {
    const options = [
      "See in block explorer",
      "Copy transaction hash",
      "Cancel",
    ];
    const methods = {
      "See in block explorer": openBlockExplorer,
      "Copy transaction hash": copyTransactionHash,
    };

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.indexOf("Cancel"),
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const selectedOption = options[selectedIndex];
        const method = (methods as any)[selectedOption];
        method?.();
      }
    );
  };

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
