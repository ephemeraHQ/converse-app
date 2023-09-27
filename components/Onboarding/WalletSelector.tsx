import { useCoinbaseWallet } from "@thirdweb-dev/react-native";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import config from "../../config";
import { textSecondaryColor } from "../../utils/colors";
import { isDesktop } from "../../utils/device";
import { getEthOSSigner } from "../../utils/ethos";
import { Signer } from "../../vendor/xmtp-js/src";
import TableView from "../TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../TableView/TableViewImage";
import { useDynamicWalletConnect } from "./DynamicWalletConnect";
import {
  InstalledWallet,
  POPULAR_WALLETS,
  getInstalledWallets,
} from "./supportedWallets";

type Props = {
  disconnect: (b: boolean) => Promise<void>;
  setConnectWithSeedPhrase: (b: boolean) => void;
  setConnectWithDesktop: (b: boolean) => void;
  setLoading: (b: boolean) => void;
  setSigner: (signer: Signer) => void;
};

export default function WalletSelector({
  disconnect,
  setConnectWithDesktop,
  setConnectWithSeedPhrase,
  setLoading,
  setSigner,
}: Props) {
  const colorScheme = useColorScheme();
  const connectToCoinbase = useCoinbaseWallet(
    `https://${config.websiteDomain}/coinbase`
  );
  const connectToWalletConnect = useDynamicWalletConnect();
  const rightView = (
    <TableViewPicto
      symbol="chevron.right"
      color={textSecondaryColor(colorScheme)}
    />
  );
  const [installedWallets, setInstalledWallets] = useState({
    checked: false,
    list: [] as InstalledWallet[],
  });

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const loadInstalledWallets = async (refresh: boolean) => {
      const list = await getInstalledWallets(refresh);
      setInstalledWallets({ checked: true, list });
    };
    loadInstalledWallets(false);
    // Things to do when app status changes (does NOT include first load)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          // App is back to active state
          loadInstalledWallets(true);
        }
        appState.current = nextAppState;
      }
    );
    return () => {
      subscription.remove();
    };
  }, [setInstalledWallets]);

  const hasInstalledWallets = installedWallets.list.length > 0;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.walletSelectorContainer,
        {
          marginBottom:
            Platform.OS === "android" ? insets.bottom + 30 : insets.bottom,
        },
      ]}
    >
      {hasInstalledWallets && !isDesktop && (
        <TableView
          title="INSTALLED APPS"
          items={installedWallets.list.map((w) => ({
            id: w.name,
            leftView: <TableViewImage imageURI={w.iconURL} />,
            rightView,
            title: `Connect ${w.name}`,
            action: async () => {
              setLoading(true);
              // Disconnecting from previous WC
              await disconnect(false);
              setTimeout(async () => {
                try {
                  if (w.name === "Coinbase Wallet") {
                    await connectToCoinbase();
                  } else if (w.name === "EthOS Wallet") {
                    const signer = getEthOSSigner();
                    if (signer) {
                      setSigner(signer);
                    } else {
                      setLoading(false);
                    }
                  } else if (w.walletConnectId && w.customScheme) {
                    const native = w.customScheme.endsWith("/")
                      ? w.customScheme.slice(0, w.customScheme.length - 1)
                      : w.customScheme;
                    await connectToWalletConnect(w.walletConnectId, {
                      name: w.name,
                      iconURL: w.iconURL,
                      links: {
                        native,
                        universal: w.universalLink || "",
                      },
                    });
                  }
                } catch (e: any) {
                  console.log("Error connecting to wallet:", e);
                  setLoading(false);
                }
              }, 10);
            },
          }))}
        />
      )}

      <TableView
        title={
          isDesktop
            ? "CONNECTION OPTIONS"
            : hasInstalledWallets
            ? "OTHER OPTIONS"
            : "CONNECT EXISTING WALLET"
        }
        items={[
          {
            id: "desktop",
            leftView: <TableViewEmoji emoji={isDesktop ? "😎" : "💻"} />,
            title: isDesktop
              ? "Connect via browser wallet"
              : "Connect via desktop",
            rightView,
            action: () => {
              if (isDesktop) {
                Linking.openURL(
                  `https://${config.websiteDomain}/connect?desktop=true`
                );
              } else {
                setConnectWithDesktop(true);
              }
            },
          },
          {
            id: "seedphrase",
            leftView: <TableViewEmoji emoji="🔑" />,
            title: "Connect via seed phrase",
            rightView,
            action: () => {
              setConnectWithSeedPhrase(true);
            },
          },
        ]}
      />
      {!hasInstalledWallets && !isDesktop && (
        <TableView
          title="POPULAR MOBILE APPS"
          items={POPULAR_WALLETS.map((w) => ({
            id: w.name,
            title: w.name,
            leftView: <TableViewImage imageURI={w.iconURL} />,
            rightView,
            action: () => {
              Linking.openURL(w.url);
            },
          }))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  walletSelectorContainer: {
    width: "100%",
    flexGrow: 1,
    marginTop: 30,
    justifyContent: "flex-end",
    paddingHorizontal: Platform.OS === "android" ? 0 : 24,
  },
});
