import Clipboard from "@react-native-clipboard/clipboard";
import {
  actionSheetColors,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import * as Linking from "expo-linking";
import { useCallback, useEffect } from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import Checkmark from "../../../assets/checkmark.svg";
import Clock from "../../../assets/clock.svg";
import Exclamationmark from "../../../assets/exclamationmark.triangle.svg";
import { useConversationContext } from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";
import { shortAddress } from "../../../utils/str";
import { useTransactionForMessage } from "../../../utils/transaction";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "../Message/Message";
import MessageTimestamp from "../Message/MessageTimestamp";

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
  error,
  showingAmount,
}: {
  fromMe: boolean;
  transactionDisplay?: string;
  status?: "PENDING" | "FAILURE" | "SUCCESS";
  colorScheme: ColorSchemeName;
  error?: string;
  showingAmount: boolean;
}) => {
  const styles = useStyles();
  const StatusIcon =
    status === "FAILURE" || error
      ? Exclamationmark
      : status === "SUCCESS"
      ? Checkmark
      : Clock;
  const statusText = error
    ? error
    : status === "PENDING"
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
          {transactionDisplay && (
            <Text
              style={[
                styles.text,
                styles.transactionDetails,
                fromMe ? styles.textMe : undefined,
              ]}
            >
              {transactionDisplay}
            </Text>
          )}
          <StatusIcon
            style={showingAmount ? styles.statusIconInline : styles.statusIcon}
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

export default function TransactionPreview({ message }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const conversation = useConversationContext("conversation");
  const { transaction, transactionDisplay, amountToDisplay } =
    useTransactionForMessage(message, conversation?.peerAddress);

  const showTransactionActionSheet = useCallback(() => {
    const methods: { [key: string]: () => void } = {};
    if (transaction.error) {
      methods["Copy message content"] = () =>
        Clipboard.setString(message.content);
    } else {
      if (transaction.blockExplorerURL) {
        methods["See in block explorer"] = () =>
          Linking.openURL(transaction.blockExplorerURL!);
      }
    }
    methods["Cancel"] = () => {};
    const options = Object.keys(methods);
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
  }, [
    colorScheme,
    message.content,
    transaction.blockExplorerURL,
    transaction.error,
  ]);

  useEffect(() => {
    const eventHandler = `showActionSheetForTxRef-${message.id}` as const;
    converseEventEmitter.on(eventHandler, showTransactionActionSheet);
    return () => {
      converseEventEmitter.off(eventHandler, showTransactionActionSheet);
    };
  }, [message.id, showTransactionActionSheet]);

  const metadataView = (
    <MessageTimestamp message={message} white={transaction.loading} />
  );

  // Converse sponsored transaction
  if (transaction.sponsored || transaction.status !== "PENDING") {
    return (
      <>
        <TransactionView fromMe={message.fromMe}>
          {amountToDisplay && (
            <Text
              style={[
                styles.text,
                styles.amount,
                message.fromMe ? styles.textMe : undefined,
              ]}
            >
              {amountToDisplay}
            </Text>
          )}
          <TransactionStatusView
            fromMe={message.fromMe}
            transactionDisplay={transactionDisplay}
            status={transaction.status}
            error={transaction.error}
            colorScheme={colorScheme}
            showingAmount={!!amountToDisplay}
          />
        </TransactionView>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else {
    return (
      <>
        <TransactionView fromMe={message.fromMe}>
          <Text
            style={[
              styles.text,
              styles.bold,
              message.fromMe ? styles.textMe : undefined,
            ]}
          >
            Transaction
          </Text>
          <Text
            style={[
              styles.text,
              styles.small,
              message.fromMe ? styles.textMe : undefined,
            ]}
          >
            Blockchain: {transaction.chainName}
          </Text>
          <Text
            style={[
              styles.text,
              styles.small,
              message.fromMe ? styles.textMe : undefined,
            ]}
          >
            Transaction hash: {shortAddress(transaction.reference)}
          </Text>
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.text,
                styles.small,
                message.fromMe ? styles.textMe : undefined,
              ]}
            >
              Status:
            </Text>
            <Clock
              style={styles.statusIconInline}
              fill={message.fromMe ? "white" : textSecondaryColor(colorScheme)}
              width={15}
              height={15}
            />
            <Text
              style={[
                styles.text,
                styles.small,
                message.fromMe ? styles.textMe : undefined,
              ]}
            >
              Pending
            </Text>
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
      fontSize: Platform.OS === "android" ? 14 : 16,
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
      fontSize: Platform.OS === "android" ? 28 : 34,
      fontWeight: Platform.OS === "android" ? "normal" : "bold",
      paddingVertical: 3,
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
      marginRight: -4,
      marginLeft: 8,
    },
    statusIconInline: {
      marginHorizontal: -4,
    },
  });
};
