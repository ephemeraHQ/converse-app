import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  useColorScheme,
} from "react-native";

import SendMoneyButtonDark from "../../assets/transaction-button-dark.svg";
import SendMoneyButtonLight from "../../assets/transaction-button.svg";
import { useConversationContext } from "../../utils/conversation";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";

export default function ChatSendMoney() {
  const { setTransactionMode } = useConversationContext(["setTransactionMode"]);

  const styles = useStyles();
  const colorScheme = useColorScheme();
  const SendMoneyButton =
    colorScheme === "light" ? SendMoneyButtonLight : SendMoneyButtonDark;

  return (
    <TouchableOpacity
      onPress={() => {
        executeAfterKeyboardClosed(() => {
          setTransactionMode(true);
        });
      }}
      activeOpacity={0.4}
    >
      <View style={styles.sendMoney}>
        <SendMoneyButton />
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
          paddingBottom: 8,
          width: 27,
          height: 27,
        },
      }),
    },
  });
};
