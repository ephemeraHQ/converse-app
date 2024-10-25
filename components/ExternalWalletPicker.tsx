import { translate } from "@i18n";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { waitUntilAppActive } from "@utils/appState/waitUntilAppActive";
import { converseEventEmitter } from "@utils/events";
import { thirdwebClient } from "@utils/thirdweb";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Account, createWallet, Wallet } from "thirdweb/wallets";

import { Drawer } from "./Drawer";
import config from "../config";
import Button from "./Button/Button";
import {
  InstalledWallet,
  useInstalledWallets,
} from "./Onboarding/supportedWallets";
import Picto from "./Picto/Picto";

export default function ExternalWalletPicker() {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined);

  const displayExternalWalletPicker = useCallback(
    (title?: string, subtitle?: string) => {
      setTitle(title);
      setSubtitle(subtitle);
      setVisible(true);
    },
    []
  );

  const pickExternalWallet = useCallback(
    async (w: InstalledWallet | undefined) => {
      if (!w) {
        converseEventEmitter.emit("externalWalletPicked", {
          wallet: undefined,
          account: undefined,
        });
        setVisible(false);
        return;
      }
      let wallet: Wallet | undefined = undefined;
      let account: Account | undefined = undefined;
      if (w.name === "Coinbase Wallet") {
        wallet = createWallet("com.coinbase.wallet", {
          appMetadata: config.walletConnectConfig.appMetadata,
          mobileConfig: {
            callbackURL: `https://${config.websiteDomain}/coinbase`,
          },
        });
      } else if (w.thirdwebId) {
        wallet = createWallet(w.thirdwebId);
      }
      if (!wallet) {
        converseEventEmitter.emit("externalWalletPicked", {
          wallet: undefined,
          account: undefined,
        });
        setVisible(false);
        return;
      }
      try {
        account = await wallet.autoConnect({ client: thirdwebClient });
      } catch {
        account = await wallet.connect({
          client: thirdwebClient,
          walletConnect: config.walletConnectConfig,
        });
      }

      if (wallet && account) {
        converseEventEmitter.emit("externalWalletPicked", {
          wallet,
          account,
        });
      } else {
        converseEventEmitter.emit("externalWalletPicked", {
          wallet: undefined,
          account: undefined,
        });
      }
      setVisible(false);
      await waitUntilAppActive(500);
    },
    []
  );

  const closeMenu = useCallback(() => {
    pickExternalWallet(undefined);
  }, [pickExternalWallet]);

  useEffect(() => {
    converseEventEmitter.on(
      "displayExternalWalletPicker",
      displayExternalWalletPicker
    );
    return () => {
      converseEventEmitter.off(
        "displayExternalWalletPicker",
        displayExternalWalletPicker
      );
    };
  }, [displayExternalWalletPicker]);

  const wallets = useInstalledWallets();

  return (
    <Drawer
      visible={visible}
      onClose={closeMenu}
      style={styles.drawer}
      showHandle
    >
      <ScrollView style={styles.wallets} alwaysBounceVertical={false}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {(title || subtitle) && <View style={styles.separator} />}
        {wallets.map((w) => (
          <TouchableOpacity
            key={w.name}
            style={styles.wallet}
            onPress={() => pickExternalWallet(w)}
          >
            <Image source={{ uri: w.iconURL }} style={styles.walletIcon} />
            <Text style={styles.walletName}>{w.name}</Text>
            <Picto
              picto="chevron.right"
              style={styles.chevron}
              size={PictoSizes.externalWallet}
              color={textPrimaryColor(colorScheme)}
              weight="semibold"
            />
          </TouchableOpacity>
        ))}
        {wallets.length === 0 && <Text>{translate("no_wallet_detected")}</Text>}
        <Button
          action="primary"
          title={translate("cancel")}
          style={styles.cta}
          onPress={closeMenu}
        />
      </ScrollView>
    </Drawer>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    drawer: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      paddingHorizontal: 0,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: textPrimaryColor(colorScheme),
    },
    subtitle: {
      fontSize: 14,
      color: textPrimaryColor(colorScheme),
    },
    separator: {
      marginTop: 13,
    },
    wallets: { paddingTop: 10, paddingHorizontal: 15 },
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
      color: textPrimaryColor(colorScheme),
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
