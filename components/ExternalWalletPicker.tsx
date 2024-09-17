import { translate } from "@i18n";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import Button from "./Button/Button";
import { Drawer, DrawerRef } from "./Drawer";
import { useInstalledWallets } from "./Onboarding/supportedWallets";
import Picto from "./Picto/Picto";

export default function ExternalWalletPicker() {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const drawerRef = useRef<DrawerRef>(null);
  const [visible, setVisible] = useState(true);
  const closeMenu = useCallback(() => {
    setVisible(false);
  }, []);
  const wallets = useInstalledWallets();
  return (
    <Drawer
      visible={visible}
      onClose={closeMenu}
      ref={drawerRef}
      style={styles.drawer}
    >
      <View>
        {wallets.map((w) => (
          <View key={w.name} style={styles.wallet}>
            <Image source={{ uri: w.iconURL }} style={styles.walletIcon} />
            <Text style={styles.walletName}>{w.name}</Text>
            <Picto
              picto="chevron.right"
              style={styles.chevron}
              size={PictoSizes.externalWallet}
              color={textPrimaryColor(colorScheme)}
              weight="semibold"
            />
          </View>
        ))}
        <Button
          variant="primary"
          title={translate("cancel")}
          style={styles.cta}
          onPress={() => drawerRef.current?.closeDrawer(() => {})}
        />
      </View>
    </Drawer>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    drawer: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
    },
    cta: {
      marginHorizontal: 0,
      marginTop: 20,
      marginBottom: 10,
    },
    wallet: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
      borderWidth: 1,
      borderColor: itemSeparatorColor(colorScheme),
      borderRadius: 12,
      padding: 8,
      marginVertical: 4,
    },
    walletName: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 8,
    },
    walletIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    chevron: {
      marginLeft: "auto",
      marginRight: 12,
    },
  });
};
