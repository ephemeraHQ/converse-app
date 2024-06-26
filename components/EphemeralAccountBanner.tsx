import {
  itemSeparatorColor,
  messageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, {
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function EphemeralAccountBanner() {
  const styles = useStyles();
  return (
    <View style={styles.demoAccountBanner}>
      <View style={styles.demoAccountBannerLeft}>
        <Text style={styles.demoAccountTitle}>This account is ephemeral</Text>
        <Text style={styles.demoAccountSubtitle} numberOfLines={4}>
          If you log out, you’ll lose all of your conversations. Log in with an
          existing wallet when you’re ready.
        </Text>
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
          marginTop: 12,
          marginBottom: 8,
          paddingVertical: 12,
          paddingLeft: 30,
        },
        android: { paddingVertical: 14, paddingLeft: 16 },
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
