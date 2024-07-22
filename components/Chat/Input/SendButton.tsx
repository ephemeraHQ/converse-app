import { TouchableOpacity, StyleSheet, useColorScheme } from "react-native";

import SendButtonDefaultDark from "../../../assets/send-button-dark.svg";
import SendButtonHigher from "../../../assets/send-button-higher.svg";
import SendButtonDefaultLight from "../../../assets/send-button-light.svg";

type SendButtonProps = {
  canSend: boolean;
  onPress: () => void;
  sendButtonType: "DEFAULT" | "HIGHER";
};

export const SendButton = ({
  canSend,
  onPress,
  sendButtonType,
}: SendButtonProps) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={canSend ? 0.4 : 0.6}
      style={[styles.sendButtonContainer, { opacity: canSend ? 1 : 0.6 }]}
    >
      {colorScheme === "dark" ? (
        sendButtonType === "DEFAULT" ? (
          <SendButtonDefaultDark
            width={36}
            height={36}
            style={styles.sendButton}
          />
        ) : (
          <SendButtonHigher width={36} height={36} style={styles.sendButton} />
        )
      ) : sendButtonType === "DEFAULT" ? (
        <SendButtonDefaultLight
          width={36}
          height={36}
          style={styles.sendButton}
        />
      ) : (
        <SendButtonHigher width={36} height={36} style={styles.sendButton} />
      )}
    </TouchableOpacity>
  );
};

const useStyles = () => {
  return StyleSheet.create({
    sendButtonContainer: {
      width: 60,
      alignItems: "center",
      marginBottom: 6,
    },
    sendButton: {
      marginTop: "auto",
    },
  });
};
