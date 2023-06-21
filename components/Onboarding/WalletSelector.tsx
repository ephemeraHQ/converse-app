import {
  useMetaMaskWallet,
  useCoinbaseWallet,
} from "@thirdweb-dev/react-native";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
  Linking as RNLinking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import config from "../../config";
import { textSecondaryColor } from "../../utils/colors";
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
};

const originalOpenURL = RNLinking.openURL.bind(RNLinking);

export default function WalletSelector({
  disconnect,
  setConnectWithDesktop,
  setConnectWithSeedPhrase,
  setLoading,
}: Props) {
  const colorScheme = useColorScheme();
  const connectToMetamask = useMetaMaskWallet();
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

  // Walletconnect parameters are url encoded but some wallets (imtoken)
  // don't work and need parameters to be url decoded

  useEffect(() => {
    RNLinking.openURL = (url) => {
      const openingWallet = installedWallets.list.find(
        (w) =>
          (w.universalLink && url.startsWith(w.universalLink)) ||
          url
            .toLowerCase()
            .startsWith(`${w.customScheme.toLowerCase()}wc?uri=wc`)
      );
      if (openingWallet && openingWallet.decodeWalletConnectURI) {
        const urlStart = openingWallet.universalLink
          ? `${openingWallet.universalLink}/wc?uri=wc`
          : `${openingWallet.customScheme}wc?uri=wc`;
        const urlEnd = url.slice(urlStart.length);
        const decodedURI = `${urlStart}${decodeURIComponent(urlEnd)}`;
        console.log(
          `[WalletConnect] Opening a decoded version of the WC URI for wallet ${openingWallet.name} : ${decodedURI}`
        );
        return originalOpenURL(decodedURI).catch((e) => {
          console.log(e);
          setLoading(false);
        });
      } else if (openingWallet) {
        return originalOpenURL(url).catch((e) => {
          console.log(e);
          setLoading(false);
        });
      }
      return originalOpenURL(url);
    };
  }, [installedWallets, setLoading]);

  // // Reset openURL when we leave
  // useEffect(() => {
  //   return () => {
  //     RNLinking.openURL = originalOpenURL;
  //   };
  // }, []);

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
      {hasInstalledWallets && (
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
                  if (w.isMetaMask) {
                    await connectToMetamask();
                  } else if (w.isCoinbase) {
                    await connectToCoinbase();
                  } else if (w.walletConnectId) {
                    const native = w.customScheme.endsWith("/")
                      ? w.customScheme.slice(0, w.customScheme.length - 1)
                      : w.customScheme;
                    await connectToWalletConnect(w.walletConnectId, {
                      name: w.name,
                      iconURL: w.iconURL,
                      links: {
                        native,
                        universal: w.universalLink,
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
          hasInstalledWallets ? "OTHER OPTIONS" : "CONNECT EXISTING WALLET"
        }
        items={[
          {
            id: "desktop",
            leftView: <TableViewEmoji emoji="💻" />,
            title: "Connect via desktop",
            rightView,
            action: () => {
              setConnectWithDesktop(true);
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
      {!hasInstalledWallets && (
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
