import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";

import {
  useAccountsStore,
  useHasOnePrivyAccount,
  useLoggedWithPrivy,
  useWalletStore,
} from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { useConversationContext } from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import { usePrivySigner } from "../../utils/evm/helpers";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import { pick } from "../../utils/objects";
import ChatActionButton from "./ChatActionButton";

export default function ChatSendMoney() {
  const { setTransactionMode } = useConversationContext(["setTransactionMode"]);
  const { setAddingNewAccount, setConnectionMethod } = useOnboardingStore((s) =>
    pick(s, ["setAddingNewAccount", "setConnectionMethod"])
  );
  const { setCurrentAccount } = useAccountsStore((s) =>
    pick(s, ["setCurrentAccount"])
  );
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;
  const alreadyConnectedToPrivy = useHasOnePrivyAccount();

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
            "Error",
            "Converse is unable to trigger a transaction. Check your internet status. If your internet is good, please kill the app and try again. If the problem is still happening, contact the Converse team."
          );
        }
      } else if (pkPath) {
        showMoneyInput();
      } else if (alreadyConnectedToPrivy) {
        Alert.alert(
          "Use Converse Account",
          "Gasless money transfers are only available on Converse accounts with telephone numbers for now.",
          [
            { text: "Cancel" },
            {
              text: "Go to Converse Account",
              isPreferred: true,
              onPress: () => {
                navigation.pop();
                setCurrentAccount(alreadyConnectedToPrivy, false);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Create Converse Account",
          "Gasless money transfers are only available on Converse accounts with telephone numbers for now.",
          [
            { text: "Cancel" },
            {
              text: "Create Converse Account",
              isPreferred: true,
              onPress: () => {
                setConnectionMethod("phone");
                setAddingNewAccount(true);
              },
            },
          ]
        );
      }
    });
  }, [
    alreadyConnectedToPrivy,
    loggedWithPrivy,
    navigation,
    pkPath,
    privySigner,
    setAddingNewAccount,
    setConnectionMethod,
    setCurrentAccount,
    showMoneyInput,
  ]);

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
