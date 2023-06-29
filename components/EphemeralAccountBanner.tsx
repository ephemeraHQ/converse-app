import React, {
  useColorScheme,
  StyleSheet,
  View,
  Text,
  ColorSchemeName,
} from "react-native";

import {
  itemSeparatorColor,
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";

export default function EphemeralAccountBanner() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.demoAccountBanner}>
      <View style={styles.demoAccountBannerLeft}>
        <Text style={styles.demoAccountTitle}>
          ℹ️ This account is ephemeral
        </Text>
        <Text style={styles.demoAccountSubtitle} numberOfLines={4}>
          If you log out, you’ll lose all of your conversations. Log in with an
          existing wallet when you’re ready.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    demoAccountBanner: {
      width: "100%",
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      paddingLeft: 30,
      paddingRight: 16,
      alignItems: "center",
      flexDirection: "row",
      top: 0,
      zIndex: 1000,
    },
    demoAccountBannerLeft: {
      flexShrink: 1,
      marginRight: 10,
    },
    demoAccountTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: textPrimaryColor(colorScheme),
    },
    demoAccountSubtitle: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      fontWeight: "400",
    },
  });
