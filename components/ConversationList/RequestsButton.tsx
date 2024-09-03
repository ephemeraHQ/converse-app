import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { actionSecondaryColor, requestsTextColor } from "@styles/colors";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { NavigationParamList } from "../../screens/Navigation/Navigation";

type Props = { requestsCount: number } & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "Blocked"
>;
export default function RequestsButton({ navigation, requestsCount }: Props) {
  const styles = useStyles();

  return (
    <Pressable
      key="requests"
      onPress={() => navigation.push("ChatsRequests")}
      style={styles.requestsHeader}
    >
      {({ pressed }) => (
        <View>
          <Text
            style={[
              styles.requestsCount,
              requestsCount === 0 && styles.zeroRequests,
              pressed && styles.pressedText,
            ]}
          >
            {requestsCount === 0 ? "Requests" : `Requests (${requestsCount})`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    requestsHeader: {
      ...Platform.select({
        android: {
          paddingLeft: 24,
          paddingRight: 14,
        },
      }),
    },
    requestsCount: {
      fontWeight: "600",
      color: requestsTextColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 14,
        },
        android: {
          marginRight: 1,
          fontSize: 11,
        },
      }),
    },
    zeroRequests: {
      color: actionSecondaryColor(colorScheme),
    },
    pressedText: {
      color: actionSecondaryColor(colorScheme),
    },
  });
};
