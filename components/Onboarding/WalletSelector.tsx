import {
  useMetaMaskWallet,
  useCoinbaseWallet,
  useTrustWallet,
} from "@thirdweb-dev/react-native";
import * as Linking from "expo-linking";
import { useContext, useEffect, useRef, useState } from "react";
import {
  AppState,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import config from "../../config";
import { AppContext } from "../../data/store/context";
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

export default function WalletSelector({
  disconnect,
  setConnectWithDesktop,
  setConnectWithSeedPhrase,
  setLoading,
}: Props) {
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const connectToMetamask = useMetaMaskWallet();
  const connectToCoinbase = useCoinbaseWallet(
    `https://${config.websiteDomain}/coinbase`
  );
  const connectToWalletConnect = useDynamicWalletConnect();
  // const connectToRainbow = useRainbowWallet();
  const connectToTrust = useTrustWallet();
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
  }, []);
  const hasInstalledWallets = installedWallets.list.length > 0;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.walletSelectorContainer, { marginBottom: insets.bottom }]}
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
                    await connectToWalletConnect(w.walletConnectId, {
                      name: w.name,
                      iconURL: w.iconURL,
                      links: {
                        native: w.customScheme.endsWith("/")
                          ? w.customScheme.slice(0, w.customScheme.length - 1)
                          : w.customScheme,
                      },
                    });
                  }
                } catch (e: any) {
                  console.log(e);
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
    paddingHorizontal: Platform.OS === "android" ? 64 : 24,
  },
});
