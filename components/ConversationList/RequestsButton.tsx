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
  actionSecondaryColor,
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import Picto from "../Picto/Picto";

type Props = { requestsCount: number } & NativeStackScreenProps<
  NavigationParamList,
  "Chats"
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
        <Picto
          picto="chevron.right"
          weight="semibold"
          color={
            Platform.OS === "android"
              ? textPrimaryColor(colorScheme)
              : actionSecondaryColor(colorScheme)
          }
          size={Platform.OS === "android" ? 25 : 10}
        />
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
          marginLeft: 32,
          borderBottomWidth: 0.25,
          borderBottomColor: listItemSeparatorColor(colorScheme),
        },
        android: {
          paddingVertical: 12,
          paddingHorizontal: 16,
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
