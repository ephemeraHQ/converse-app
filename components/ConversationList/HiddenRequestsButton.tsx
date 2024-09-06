import {
  actionSecondaryColor,
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";

import Picto from "../Picto/Picto";

type Props = {
  spamCount: number;
  handlePress: () => void;
  toggleActivated: boolean;
};

export default function HiddenRequestsButton({
  spamCount,
  handlePress,
  toggleActivated = false,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  return (
    <TouchableHighlight
      underlayColor={clickedItemBackgroundColor(colorScheme)}
      key="spam"
      onPress={handlePress}
    >
      <View style={styles.spamHeader}>
        <Text style={styles.spamHeaderTitle}>Hidden requests</Text>
        <Text style={styles.spamCount}>{spamCount}</Text>
        <Picto
          picto={toggleActivated ? "chevron.down" : "chevron.right"}
          color={
            Platform.OS === "android"
              ? textPrimaryColor(colorScheme)
              : actionSecondaryColor(colorScheme)
          }
          size={PictoSizes.hiddenRequests}
        />
      </View>
    </TouchableHighlight>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    spamHeader: {
      flexDirection: "row",
      alignItems: "center",
      ...Platform.select({
        default: {
          paddingVertical: 8,
          paddingRight: 24,
          paddingLeft: 32,
          borderBottomWidth: 0.25,
          borderBottomColor: listItemSeparatorColor(colorScheme),
          borderTopWidth: 0.25,
          borderTopColor: listItemSeparatorColor(colorScheme),
        },
        android: {
          paddingVertical: 12,
          paddingLeft: 24,
          paddingRight: 14,
        },
      }),
    },
    spamHeaderTitle: {
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
    spamCount: {
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
