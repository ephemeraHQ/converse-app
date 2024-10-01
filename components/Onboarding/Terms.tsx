import { translate } from "@i18n";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import * as Linking from "expo-linking";
import React from "react";
import { Platform, StyleSheet, Text, useColorScheme } from "react-native";

export const Terms = React.memo(() => {
  const styles = useStyles();

  return (
    <Text style={styles.links}>
      {translate("termsText")}{" "}
      <Text
        style={styles.link}
        onPress={() =>
          Linking.openURL(
            "https://converseapp.notion.site/Terms-and-conditions-004036ad55044aba888cc83e21b8cbdb"
          )
        }
      >
        {translate("termsLink")}
      </Text>
    </Text>
  );
});

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    links: {
      textAlign: "center",
      marginLeft: 32,
      marginRight: 32,
      ...Platform.select({
        default: {
          fontSize: 13,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
    link: {
      textDecorationLine: "underline",
    },
  });
};
