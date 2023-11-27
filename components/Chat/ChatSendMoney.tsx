import { TouchableOpacity, View, StyleSheet, Platform } from "react-native";

import { useConversationContext } from "../../utils/conversation";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import ChatActionButton from "./ChatActionButton";

export default function ChatSendMoney() {
  const { setTransactionMode } = useConversationContext(["setTransactionMode"]);

  const styles = useStyles();

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
