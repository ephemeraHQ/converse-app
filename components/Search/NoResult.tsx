import React, {
  useColorScheme,
  StyleSheet,
  View,
  Text,
  Platform,
} from "react-native";

import {
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
  messageBubbleColor,
} from "../../utils/colors";

export default function NoResult() {
  const styles = useStyles();
  return (
    <View style={styles.demoAccountBanner}>
      <View style={styles.demoAccountBannerLeft}>
        <Text style={styles.demoAccountTitle}>No Result</Text>
      </View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    demoAccountBanner: {
      width: "100%",
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: messageBubbleColor(colorScheme),
      paddingRight: 16,
      alignItems: "center",
      flexDirection: "row",
      top: 0,
      zIndex: 1000,
      ...Platform.select({
        default: {
          paddingVertical: 8,
          paddingLeft: 30,
          borderBottomWidth: 0.5,
        },
        android: { paddingVertical: 12, paddingLeft: 16, borderBottomWidth: 0 },
      }),
    },
    demoAccountBannerLeft: {
      flexShrink: 1,
      marginRight: 10,
    },
    demoAccountTitle: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          fontWeight: "600",
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    demoAccountSubtitle: {
      fontSize: Platform.OS === "android" ? 14 : 15,
      color: textSecondaryColor(colorScheme),
      fontWeight: "400",
    },
  });
};
