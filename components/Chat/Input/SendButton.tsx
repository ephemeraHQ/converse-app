import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import SendButtonDefaultDark from "../../../assets/send-button-dark.svg";
import SendButtonHigher from "../../../assets/send-button-higher.svg";
import SendButtonDefaultLight from "../../../assets/send-button-light.svg";

type SendButtonProps = {
  onPress: () => void;
};

export const SendButton = memo(function SendButton(props: SendButtonProps) {
  const { onPress } = props;

  const styles = useStyles();
  const colorScheme = useColorScheme();

  const inputValue = "";
  const mediaPreview = null;

  const canSend = inputValue.length > 0 || !!mediaPreview?.mediaURI;

  const sendButtonType = getSendButtonType(inputValue);

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
});

const getSendButtonType = (input: string): "DEFAULT" | "HIGHER" => {
  if (input.match(/\bhigher\b/gi)) {
    return "HIGHER";
  }
  return "DEFAULT";
};

const useStyles = () => {
  const { theme } = useAppTheme();

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
