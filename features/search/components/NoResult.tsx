import { primaryColor, textPrimaryColor } from "@styles/colors";
import React, {
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

import { useRouter } from "@navigation/useNavigation";

export default function NoResult() {
  const styles = useStyles();

  const router = useRouter();

  return (
    <>
      <Text style={styles.emoji}>👀</Text>
      <Text style={styles.title}>
        <Text>
          We could not find any result in your existing conversations. You might
          want to{" "}
        </Text>
        <Text
          style={styles.clickableText}
          onPress={() => {
            router.navigate("NewConversation", {});
          }}
        >
          start a new conversation
        </Text>
      </Text>
    </>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    emoji: {
      ...Platform.select({
        default: {
          textAlign: "center",
          marginTop: 150,
          fontSize: 34,
          marginBottom: 12,
        },
        android: {
          display: "none",
        },
      }),
    },
    title: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          textAlign: "center",
          fontSize: 17,
          paddingHorizontal: 32,
        },
        android: {
          textAlign: "left",
          fontSize: 16,
          lineHeight: 22,
          paddingTop: 10,
          paddingHorizontal: 16,
        },
      }),
    },
    clickableText: {
      color: primaryColor(colorScheme),
      fontWeight: "500",
    },
  });
};
