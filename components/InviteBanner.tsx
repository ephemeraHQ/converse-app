import React, {
  useColorScheme,
  StyleSheet,
  View,
  Text,
  ColorSchemeName,
  TouchableOpacity,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import {
  itemSeparatorColor,
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import Button from "./Button";
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
          Get faster answers
        </Text>
      </View>
      <Button
        title="Invite"
        variant="grey"
        style={styles.inviteButton}
        onPress={onClickInvite}
      />
      <TouchableOpacity activeOpacity={0.6} onPress={onClickHide}>
        <SFSymbol
          name="xmark"
          scale="large"
          color="#8E8E93"
          size={13}
          resizeMode="center"
          multicolor={false}
          style={styles.xmark}
        />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    inviteBanner: {
      height: 63,
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      paddingLeft: 30,
      paddingRight: 25,
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
    xmark: {
      width: 13,
      height: 13,
      marginLeft: 12,
    },
  });
