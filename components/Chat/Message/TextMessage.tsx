import ClickableText from "@components/ClickableText";
import { useAppTheme } from "@theme/useAppTheme";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

type TextMessageProps = {
  fromMe: boolean;
  hideBackground?: boolean;
  content?: string;
};

export const TextMessage = ({
  fromMe,
  hideBackground,
  content,
}: TextMessageProps) => {
  const styles = useStyles();
  return (
    <View style={styles.messageContentContainer}>
      <ClickableText
        style={[
          styles.messageText,
          fromMe ? styles.messageTextMe : undefined,
          hideBackground ? styles.allEmojisAndMaxThree : undefined,
        ]}
      >
        {content}
      </ClickableText>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        messageContentContainer: {
          paddingHorizontal: 13,
          paddingVertical: 6,
        },
        messageText: {
          fontSize: 17,
        },
        messageTextMe: {},
        allEmojisAndMaxThree: {
          fontSize: 64,
          paddingHorizontal: 0,
        },
      }),
    [theme]
  );
};
