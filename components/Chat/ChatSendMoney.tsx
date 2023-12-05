import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect } from "react";
import { TouchableOpacity, View, StyleSheet, Platform } from "react-native";

import {
  useLoggedWithPrivy,
  useWalletStore,
} from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { useConversationContext } from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import ChatActionButton from "./ChatActionButton";

export default function ChatSendMoney() {
  const { setTransactionMode } = useConversationContext(["setTransactionMode"]);

  const styles = useStyles();
  const loggedWithPrivy = useLoggedWithPrivy();
  const pkPath = useWalletStore((s) => s.privateKeyPath);
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const showMoneyInput = useCallback(() => {
    setTransactionMode(true);
  }, [setTransactionMode]);

  const showMoneyInputIfPossible = useCallback(() => {
    // If it's not a privy account
    // we need the private key!
    executeAfterKeyboardClosed(async () => {
      if (loggedWithPrivy || pkPath) {
        showMoneyInput();
      } else {
        navigation.navigate("EnableTransactions");
      }
    });
  }, [showMoneyInput, loggedWithPrivy, navigation, pkPath]);

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
