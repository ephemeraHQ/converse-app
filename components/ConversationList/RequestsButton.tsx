import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  TouchableHighlight,
  useColorScheme,
  StyleSheet,
  Platform,
  View,
  Text,
} from "react-native";

import { NavigationParamList } from "../../screens/Navigation/Navigation";
import {
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";

type Props = { requestsCount: number } & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame"
>;
export default function RequestsButton({ navigation, requestsCount }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  return (
    <TouchableHighlight
      underlayColor={clickedItemBackgroundColor(colorScheme)}
      key="requests"
      onPress={() => {
        navigation.push("ChatsRequests");
      }}
    >
      <View style={styles.requestsHeader}>
        <Text style={styles.requestsHeaderTitle}>Requests</Text>
        <Text style={styles.requestsCount}>{requestsCount}</Text>
      </View>
    </TouchableHighlight>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    requestsHeader: {
      flexDirection: "row",
      alignItems: "center",
      ...Platform.select({
        default: {
          paddingVertical: 8,
          paddingRight: 24,
          paddingLeft: 32,
          height: 40,
          borderBottomWidth: 0.25,
          borderBottomColor: listItemSeparatorColor(colorScheme),
        },
        android: {
          paddingVertical: 12,
          paddingLeft: 24,
          paddingRight: 14,
        },
      }),
    },
    requestsHeaderTitle: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          fontWeight: "600",
          marginBottom: 3,
          marginRight: 110,
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    requestsCount: {
      marginLeft: "auto",

      ...Platform.select({
        default: {
          marginRight: 16,
          fontSize: 15,
          color: textSecondaryColor(colorScheme),
        },
        android: {
          marginRight: 1,
          fontSize: 11,
          color: primaryColor(colorScheme),
        },
      }),
    },
  });
};
