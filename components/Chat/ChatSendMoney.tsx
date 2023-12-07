import { useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";

import {
  useLoggedWithPrivy,
  useWalletStore,
} from "../../data/store/accountsStore";
import { useConversationContext } from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import { usePrivySigner } from "../../utils/evm/helpers";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import ChatActionButton from "./ChatActionButton";

export default function ChatSendMoney() {
  const { setTransactionMode } = useConversationContext(["setTransactionMode"]);

  const styles = useStyles();
  const loggedWithPrivy = useLoggedWithPrivy();
  const privySigner = usePrivySigner();
  const pkPath = useWalletStore((s) => s.privateKeyPath);

  const showMoneyInput = useCallback(() => {
    setTransactionMode(true);
  }, [setTransactionMode]);

  const showMoneyInputIfPossible = useCallback(() => {
    // If it's not a privy account
    // we need the private key!
    executeAfterKeyboardClosed(async () => {
      if (loggedWithPrivy) {
        if (privySigner) {
          showMoneyInput();
        } else {
          Alert.alert(
            "We couldn't get a signer to trigger transaction. Please try again or contact Converse team."
          );
        }
      } else if (pkPath) {
        showMoneyInput();
      } else {
        Alert.alert("This feature is only available in Privy accounts");
        // navigation.navigate("EnableTransactions");
      }
    });
  }, [loggedWithPrivy, pkPath, privySigner, showMoneyInput]);

  useEffect(() => {
    converseEventEmitter.on("enable-transaction-mode", showMoneyInput);
    return () => {
      converseEventEmitter.off("enable-transaction-mode", showMoneyInput);
    };
  }, [showMoneyInput, showMoneyInputIfPossible]);

  return (
    <TouchableOpacity onPress={showMoneyInputIfPossible} activeOpacity={0.4}>
      <View style={styles.sendMoney}>
        <ChatActionButton picto="dollarsign" />
      </View>
    </TouchableOpacity>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    sendMoney: {
      flex: 1,
      justifyContent: "center",
      alignItems: "flex-end",
      flexDirection: "row",
      marginLeft: 16,
      ...Platform.select({
        default: {
          paddingBottom: 6,
          width: 27,
          height: 27,
        },
        android: {
          paddingBottom: 6,
          width: 27,
          height: 27,
        },
      }),
    },
  });
};
