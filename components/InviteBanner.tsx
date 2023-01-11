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
import Button from "./Button";
// import { conversationName } from "../utils/str";

export default function InviteBanner() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.inviteBanner}>
      <View style={styles.inviteBannerLeft}>
        <Text style={styles.inviteTitle}>Invite to Converse</Text>
        <Text style={styles.inviteSubtitle} numberOfLines={1}>
          {/* {conversationName(conversation)} is eligible */}
        </Text>
      </View>
      <Button
        title="Invite"
        variant="grey"
        style={styles.inviteButton}
        // onPress={inviteToConverse}
      />
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    inviteBanner: {
      height: 63,
      borderBottomWidth: 1,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 30,
      alignItems: "center",
      flexDirection: "row",
    },
    inviteBannerLeft: {
      flexShrink: 1,
      marginRight: 10,
    },
    inviteTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: textPrimaryColor(colorScheme),
    },
    inviteSubtitle: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      fontWeight: "400",
    },
    inviteButton: {
      marginLeft: "auto",
    },
  });
