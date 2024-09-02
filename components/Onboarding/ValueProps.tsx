import { translate, TxKeyPath } from "@i18n";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";

import Encrypted from "../../assets/encrypted.svg";
import Picto from "../Picto/Picto";

const ValueProps = () => {
  const styles = useStyles();

  return (
    <View style={styles.valuePropsContainer}>
      <ValuePropItem
        icon={<Encrypted width={32} height={32} />}
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
      gap: 32,
      maxWidth: 340,
      alignSelf: "center",
      paddingVertical: 24,
    },
    valuePropsItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
    },
    valuePropsItemIconContainer: {
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    valuePropsItemTextContainer: {
      flexShrink: 1,
      flexDirection: "column",
      gap: 4,
    },
    valuePropsItemTitle: {
      fontWeight: "500",
      fontSize: 16,
      lineHeight: 22,
      color: textPrimaryColor(colorScheme),
    },
    valuePropsItemText: {
      fontSize: 14,
      lineHeight: 20,
      color: textSecondaryColor(colorScheme),
    },
  });
};

export default ValueProps;
