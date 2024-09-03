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
          <Text style={[styles.requestsCount, pressed && styles.pressedText]}>
            Requests ({requestsCount})
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
    pressedText: {
      color: actionSecondaryColor(colorScheme),
    },
  });
};
