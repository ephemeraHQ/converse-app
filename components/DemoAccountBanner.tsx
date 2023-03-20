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

export default function DemoAccountBanner() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.demoAccountBanner}>
      <View style={styles.demoAccountBannerLeft}>
        <Text style={styles.demoAccountTitle}>This is a demo account</Text>
        <Text style={styles.demoAccountSubtitle} numberOfLines={2}>
          Sign in with a third party wallet to keep track of your conversations.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    demoAccountBanner: {
      height: 76,
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      paddingLeft: 30,
      paddingRight: 16,
      alignItems: "center",
      flexDirection: "row",
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
