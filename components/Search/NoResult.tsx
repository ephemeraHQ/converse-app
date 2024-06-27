import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { primaryColor, textPrimaryColor } from "@styles/colors";
import React, {
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

export default function NoResult({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  const styles = useStyles();

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
            navigation.navigate("NewConversation", { focus: true });
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
