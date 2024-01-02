// TODO import { ContentTypeTransactionReference } from "@xmtp/content-type-transaction-reference";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Signer } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Platform,
  Text,
  Alert,
} from "react-native";
import uuid from "react-native-uuid";

import SendButton from "../../assets/send-button.svg";
import config from "../../config";
import { currentAccount, useWalletStore } from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { postUSDCTransferAuthorization } from "../../utils/api";
import {
  actionSecondaryColor,
  backgroundColor,
  dangerColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { isDesktop } from "../../utils/device";
import { getTransferAuthorization } from "../../utils/evm/erc20";
import { evmHelpers, getCurrentAccountSigner } from "../../utils/evm/helpers";
import { usePrivySigner } from "../../utils/evm/privy";
import provider from "../../utils/evm/provider";
import { sendMessage } from "../../utils/message";
import { sentryTrackError } from "../../utils/sentry";
import {
  refreshBalanceForAccount,
  refreshBalanceForAccounts,
} from "../../utils/wallet";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import ChatActionButton from "./ChatActionButton";

export default function ChatTransactionInput() {
  const USDCBalance = useWalletStore((s) => s.USDCBalance);
  const { conversation, setTransactionMode, transactionMode } =
    useConversationContext([
      "conversation",
      "setTransactionMode",
      "transactionMode",
    ]);
  const privySigner = usePrivySigner();

  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [inputValue, setInputValue] = useState("");
  const transactionInputRef = useRef<TextInput | null>(null);
  const [transactionValue, setTransactionValue] = useState({
    value: "",
    valid: false,
    overBalance: false,
  });
  const [txStatus, setTxStatus] = useState({
    status: undefined as undefined | "sending" | "failure" | "success",
    canCancel: false,
  });

  useEffect(() => {
    if (!transactionMode) {
      setInputValue("");
    }
  }, [transactionMode]);

  useEffect(() => {
    refreshBalanceForAccount(currentAccount());
  }, []);

  useEffect(() => {
    try {
      const trimmedValue = inputValue.trim();
      if (trimmedValue.length === 0) {
        setTransactionValue({
          valid: false,
          value: "",
          overBalance: false,
        });
        return;
      }

      const fixedInput = trimmedValue.replaceAll(",", ".");
      if (isNaN(Number(fixedInput))) {
        setTransactionValue({
          valid: false,
          value: "",
          overBalance: false,
        });
        return;
      }

      const bigNumberValue = evmHelpers.toDecimal(
        fixedInput,
        config.evm.USDC.decimals
      );

      if (bigNumberValue.isZero()) {
        setTransactionValue({
          valid: false,
          value: "",
          overBalance: false,
        });
        return;
      }

      const bigNumberBalance = evmHelpers.bigNumberify(USDCBalance);

      if (bigNumberBalance.sub(bigNumberValue).isNegative()) {
        setTransactionValue({
          valid: false,
          value: "",
          overBalance: true,
        });
        return;
      }
      setTransactionValue({
        valid: true,
        value: bigNumberValue.toString(),
        overBalance: false,
      });
    } catch (e) {
      console.log(e);
      setTransactionValue({
        valid: false,
        value: "",
        overBalance: false,
      });
    }
  }, [USDCBalance, inputValue]);

  const txUUID = useRef("");

  const triggerTx = useCallback(async () => {
    if (conversation && transactionValue.value.length > 0) {
      let signer = privySigner as Signer | undefined;
      if (!signer) {
        signer = await getCurrentAccountSigner();
      }
      if (!signer) {
        setTxStatus({ status: "failure", canCancel: false });
        Alert.alert(
          "We couldn't get a signer to trigger transaction. Please try again or contact Converse team."
        );
        return;
      }
      const thisUUID = uuid.v4().toString();
      txUUID.current = thisUUID;
      setTxStatus({ status: "sending", canCancel: true });
      await new Promise((r) => setTimeout(r, 2000));
      // An action has been done by user, probably to cancel
      if (txUUID.current !== thisUUID) return;
      setTxStatus({ status: "sending", canCancel: false });
      try {
        const authorization = await getTransferAuthorization(
          config.evm.USDC.contractAddress,
          transactionValue.value,
          conversation.peerAddress,
          signer
        );

        const txHash = await postUSDCTransferAuthorization(
          await signer.getAddress(),
          authorization.message,
          authorization.signature
        );

        const txReceipt = await provider.waitForTransaction(txHash);
        if (txReceipt.status === 1) {
          // This is success
          setTxStatus({ status: "success", canCancel: false });
          refreshBalanceForAccounts();
          await new Promise((r) => setTimeout(r, 2000));
          sendMessage({
            conversation,
            content: JSON.stringify({
              namespace: "eip155",
              networkId: config.evm.transactionChainId,
              reference: txHash,
              metadata: {
                transactionType: "transfer",
                currency: "USDC",
                amount: transactionValue.value,
                decimals: config.evm.USDC.decimals,
                fromAddress: currentAccount(),
                toAddress: conversation.peerAddress,
              },
            }),
            contentType: "xmtp.org/transactionReference:1.0",
            contentFallback: `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: ${txHash}`,
          });
          setTransactionMode(false);
        } else {
          // This is failure
          setTxStatus({ status: "failure", canCancel: false });
        }
      } catch (e) {
        // This is failure
        sentryTrackError(e);
        setTxStatus({ status: "failure", canCancel: false });
      }
    }
  }, [conversation, privySigner, setTransactionMode, transactionValue.value]);

  const cancelTransaction = useCallback(() => {
    txUUID.current = "";
    setTxStatus({ status: undefined, canCancel: false });
  }, []);

  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const topUp = useCallback(() => {
    navigation.pop(1);
    setTimeout(() => {
      navigation.push("Profile", { address: currentAccount() });
    }, 300);
  }, [navigation]);

  const amountPreviewText = transactionValue.valid
    ? `${evmHelpers.fromDecimal(
        transactionValue.value,
        config.evm.USDC.decimals
      )} USDC - `
    : "0.00 USDC - ";
  const balancePreviewText = evmHelpers
    .fromDecimal(USDCBalance, config.evm.USDC.decimals, 2)
    .toString();

  return (
    <View style={styles.transactionInputContainer}>
      <TouchableOpacity
        onPress={() => {
          if (txStatus.status === "sending" || txStatus.status === "success")
            return;
          setTransactionMode(false);
        }}
        activeOpacity={
          txStatus.status === "sending" || txStatus.status === "success"
            ? 0
            : 0.6
        }
        style={{
          opacity:
            txStatus.status === "sending" || txStatus.status === "success"
              ? 0
              : 1,
        }}
      >
        <ChatActionButton picto="xmark" style={styles.closeButton} />
      </TouchableOpacity>
      <View style={styles.middleContainer}>
        <View style={styles.separatorView} />
        <View>
          <View style={styles.moneyInputContainer}>
            <Text
              style={[
                styles.moneyInputPrefix,
                {
                  color: transactionValue.valid
                    ? textPrimaryColor(colorScheme)
                    : actionSecondaryColor(colorScheme),
                },
              ]}
            >
              $
            </Text>
            <TextInput
              autoCorrect={false}
              autoComplete="off"
              autoFocus
              editable={!txStatus.status}
              keyboardType="decimal-pad"
              style={styles.moneyInput}
              value={inputValue}
              maxLength={10}
              // On desktop, we modified React Native RCTUITextView.m
              // to handle key Shift + Enter to add new line
              // This disables the flickering on Desktop when hitting Enter
              blurOnSubmit={isDesktop}
              // Mainly used on Desktop so that Enter sends the message
              onSubmitEditing={() => {
                triggerTx();
              }}
              onChangeText={(t: string) => {
                setInputValue(t);
              }}
              placeholder="0"
              placeholderTextColor={actionSecondaryColor(colorScheme)}
              ref={transactionInputRef}
            />
          </View>
          <View style={styles.bottomMessage}>
            {!txStatus.status && transactionValue.overBalance && (
              <Text style={styles.bottomMessageText}>
                Balance: {balancePreviewText} USDC -{" "}
                <Text style={styles.topUp} onPress={topUp}>
                  top up
                </Text>
              </Text>
            )}
            {!txStatus.status && !transactionValue.overBalance && (
              <Text style={styles.bottomMessageText}>
                Balance: {balancePreviewText} USDC - No fee 😉
              </Text>
            )}
            {txStatus.status === "success" && (
              <Text style={styles.bottomMessageText}>
                {amountPreviewText}🥳 Sent
              </Text>
            )}
            {txStatus.status === "failure" && (
              <Text style={styles.bottomMessageText}>
                ☹️ error - your money was not sent
              </Text>
            )}
            {txStatus.status === "sending" && (
              <View style={styles.sendingIndicator}>
                <ActivityIndicator size="small" style={{ marginRight: 10 }} />
                <Text style={styles.bottomMessageText}>
                  {amountPreviewText}Sending...
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.separatorView} />
      </View>

      <View style={styles.rightButtonsContainer}>
        {!txStatus.status && (
          <TouchableOpacity
            onPress={triggerTx}
            activeOpacity={transactionValue.valid ? 0.4 : 0.6}
            style={[{ opacity: transactionValue.valid ? 1 : 0.6 }]}
          >
            <SendButton width={36} height={36} style={styles.sendButton} />
          </TouchableOpacity>
        )}
        {txStatus.status === "sending" && txStatus.canCancel && (
          <TouchableOpacity onPress={cancelTransaction} activeOpacity={0.6}>
            <Text style={styles.errorButton}>Cancel</Text>
          </TouchableOpacity>
        )}
        {txStatus.status === "failure" && (
          <TouchableOpacity onPress={triggerTx} activeOpacity={0.6}>
            <Text style={styles.errorButton}>Try again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    transactionInputContainer: {
      backgroundColor: backgroundColor(colorScheme),
      flexDirection: "row",
      height: 88,
    },
    closeButton: {
      marginLeft: 12,
      marginTop: 13,
    },
    middleContainer: { flex: 1, flexDirection: "row" },
    separatorView: { width: 12, flexGrow: 1 },
    moneyInputContainer: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: backgroundColor(colorScheme),
      height: 50,
      marginVertical: 6,
      paddingLeft: 12,
      paddingRight: 12,
      borderBottomWidth: 0.5,
      borderColor: itemSeparatorColor(colorScheme),
    },
    moneyInputPrefix: {
      fontSize: 34,
      top: Platform.OS === "android" ? 1.5 : 4,
      marginRight: 10,
    },
    moneyInput: {
      fontSize: 34,
      color: textPrimaryColor(colorScheme),
      minWidth: 21,
      lineHeight: Platform.OS === "android" ? 50 : 40,
      ...Platform.select({
        default: {},
        web: { maxWidth: 100, textAlign: "center" },
      }),
    },
    rightButtonsContainer: { width: 46 },
    sendButton: {
      marginTop: 13,
    },
    bottomMessage: {
      flex: 1,
      alignItems: "center",
    },
    bottomMessageText: {
      color: textSecondaryColor(colorScheme),
    },
    sendingIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    errorButton: {
      color: dangerColor(colorScheme),
      position: "absolute",
      right: 12,
      top: 23,
      width: 100,
      textAlign: "right",
    },
    topUp: {
      color: textPrimaryColor(colorScheme),
      textDecorationLine: "underline",
    },
  });
};
