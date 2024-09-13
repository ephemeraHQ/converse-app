import { translate, TxKeyPath } from "@i18n";
import {
  textPrimaryColor,
  textSecondaryColor,
  itemSeparatorColor,
  primaryColor,
} from "@styles/colors";
import React from "react";
import { View, Text, StyleSheet, useColorScheme, Platform } from "react-native";

import Encrypted from "../../assets/Encrypted";
import Picto from "../Picto/Picto";

const ValueProps = () => {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  return (
    <View style={styles.valuePropsContainer}>
      <ValuePropItem
        icon={
          Platform.OS === "ios" ? (
            <Encrypted
              width={32}
              height={32}
              color={primaryColor(colorScheme)}
            />
          ) : (
            <Picto picto="lock" size={18} />
          )
        }
        titleKey="connectViaWallet.valueProps.e2eEncryption.title"
        subtitleKey="connectViaWallet.valueProps.e2eEncryption.subtitle"
      />
      <ValuePropItem
        icon={<Picto picto="key" size={18} />}
        titleKey="connectViaWallet.valueProps.ownCommunications.title"
        subtitleKey="connectViaWallet.valueProps.ownCommunications.subtitle"
      />
      <ValuePropItem
        icon={<Picto picto="qrcode" size={18} />}
        titleKey="connectViaWallet.valueProps.chatSecurely.title"
        subtitleKey="connectViaWallet.valueProps.chatSecurely.subtitle"
      />
    </View>
  );
};

const ValuePropItem = ({
  icon,
  titleKey,
  subtitleKey,
}: {
  icon: React.ReactNode;
  titleKey: TxKeyPath;
  subtitleKey: TxKeyPath;
}) => {
  const styles = useStyles();

  return (
    <View style={styles.valuePropsItem}>
      <View style={styles.valuePropsItemIconContainer}>{icon}</View>
      <View style={styles.valuePropsItemTextContainer}>
        <Text style={styles.valuePropsItemTitle}>{translate(titleKey)}</Text>
        <Text style={styles.valuePropsItemText}>{translate(subtitleKey)}</Text>
      </View>
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    valuePropsContainer: {
      flexDirection: "column",
      gap: 8,
      alignSelf: "center",
      padding: 24,
    },
    valuePropsItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderWidth: 1,
      borderColor: itemSeparatorColor(colorScheme),
      borderRadius: 8,
      padding: 16,
    },
    valuePropsItemIconContainer: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    valuePropsItemTextContainer: {
      flexShrink: 1,
      flexDirection: "column",
      gap: 4,
    },
    valuePropsItemTitle: {
      fontWeight: "600",
      fontSize: 15,
      lineHeight: 20,
      color: textPrimaryColor(colorScheme),
    },
    valuePropsItemText: {
      fontSize: 13,
      lineHeight: 20,
      color: textSecondaryColor(colorScheme),
    },
  });
};

export default ValueProps;
