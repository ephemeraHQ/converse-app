import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, {
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
} from "react-native";

import { textPrimaryColor, primaryColor } from "../../utils/colors";

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
      textAlign: "center",
      marginTop: 150,
      fontSize: 34,
      marginBottom: 12,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          paddingHorizontal: 32,
        },
        android: {
          fontSize: 14,
          paddingHorizontal: 39,
        },
      }),
      textAlign: "center",
    },
    clickableText: {
      color: primaryColor(colorScheme),
      fontWeight: "500",
    },
  });
};
