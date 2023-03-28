import React, {
  useColorScheme,
  StyleSheet,
  View,
  Text,
  ColorSchemeName,
  TouchableOpacity,
  Platform,
} from "react-native";

import {
  itemSeparatorColor,
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import Button from "./Button/Button";
import Picto from "./Picto/Picto";
// import { conversationName } from "../utils/str";

type Props = {
  onClickInvite: () => void;
  onClickHide: () => void;
};

export default function InviteBanner({ onClickInvite, onClickHide }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.inviteBanner}>
      <View style={styles.inviteBannerLeft}>
        <Text style={styles.inviteTitle}>Invite to Converse</Text>
        <Text style={styles.inviteSubtitle} numberOfLines={1}>
          Get faster responses
        </Text>
      </View>
      <Button
        title="Invite"
        variant="grey"
        style={styles.inviteButton}
        onPress={onClickInvite}
      />
      <TouchableOpacity activeOpacity={0.6} onPress={onClickHide}>
        <Picto
          picto="xmark"
          color={
            Platform.OS === "android"
              ? textSecondaryColor(colorScheme)
              : "#8E8E93"
          }
          size={Platform.OS === "android" ? 24 : 13}
          style={styles.xmark}
        />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    inviteBanner: {
      ...Platform.select({
        default: {
          height: 63,
          borderBottomWidth: 0.5,
          paddingLeft: 30,
          paddingRight: 25,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: {
          height: 72,
          paddingLeft: 16,
          paddingRight: 14,
        },
      }),
      backgroundColor: backgroundColor(colorScheme),
      alignItems: "center",
      flexDirection: "row",
    },
    inviteBannerLeft: {
      flexShrink: 1,
      marginRight: 10,
    },
    inviteTitle: {
      ...Platform.select({
        default: { fontSize: 17, fontWeight: "600" },
        android: { fontSize: 16, fontWeight: "400" },
      }),
      color: textPrimaryColor(colorScheme),
    },
    inviteSubtitle: {
      ...Platform.select({
        default: { fontSize: 15 },
        android: { fontSize: 14 },
      }),
      color: textSecondaryColor(colorScheme),
      fontWeight: "400",
    },
    inviteButton: {
      marginLeft: "auto",
    },
    xmark: {
      ...Platform.select({
        default: { width: 13, height: 13 },
        android: { top: 1 },
      }),
      marginLeft: 12,
    },
  });
