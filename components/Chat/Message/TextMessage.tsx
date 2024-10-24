import ClickableText from "@components/ClickableText";
import { inversePrimaryColor, textPrimaryColor } from "@styles/colors";
import { useMemo } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

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
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        messageContentContainer: {
          paddingHorizontal: 13,
          paddingVertical: 6,
        },
        messageText: {
          color: textPrimaryColor(colorScheme),
          fontSize: 17,
        },
        messageTextMe: {
          color: inversePrimaryColor(colorScheme),
        },
        allEmojisAndMaxThree: {
          fontSize: 64,
          paddingHorizontal: 0,
        },
      }),
    [colorScheme]
  );
};
