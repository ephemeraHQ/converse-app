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
import { useHasOnePrivyAccount } from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { textSecondaryColor } from "../../utils/colors";
import { isDesktop } from "../../utils/device";
import { getEthOSSigner } from "../../utils/ethos";
import { pick } from "../../utils/objects";
import Button from "../Button/Button";
import TableView from "../TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../TableView/TableViewImage";
import { useDynamicWalletConnect } from "./DynamicWalletConnect";
import OnboardingComponent from "./OnboardingComponent";
import {
  InstalledWallet,
  POPULAR_WALLETS,
  getInstalledWallets,
  installedWallets,
} from "./supportedWallets";

export default function WalletSelector() {
  const {
    setConnectionMethod,
    setSigner,
    setLoading,
    addingNewAccount,
    setAddingNewAccount,
  } = useOnboardingStore((s) =>
    pick(s, [
      "setConnectionMethod",
      "setSigner",
      "setLoading",
      "addingNewAccount",
      "setAddingNewAccount",
    ])
  );
  const colorScheme = useColorScheme();
  const connectToCoinbase = useCoinbaseWallet(
    new URL(`https://${config.websiteDomain}/coinbase`)
  );
  const connectToWalletConnect = useDynamicWalletConnect();
  const rightView = (
    <TableViewPicto
      symbol="chevron.right"
      color={textSecondaryColor(colorScheme)}
    />
  );
  const [walletsInstalled, setWalletsInstalled] = useState({
    checked: false,
    list: installedWallets as InstalledWallet[],
  });

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const loadInstalledWallets = async (refresh: boolean) => {
      const list = await getInstalledWallets(refresh);
      setWalletsInstalled({ checked: true, list });
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
  }, [setWalletsInstalled]);

  const hasInstalledWallets = walletsInstalled.list.length > 0;
  const insets = useSafeAreaInsets();
  const alreadyConnectedToPrivy = useHasOnePrivyAccount();
  return (
    <OnboardingComponent
      title="GM"
      picto="message.circle.fill"
      subtitle="Converse connects web3 identities with each other. Connect your wallet to start chatting."
    >
      <View
        style={[
          styles.walletSelectorContainer,
          {
            marginBottom:
              Platform.OS === "android" ? insets.bottom + 30 : insets.bottom,
          },
        ]}
      >
        {!alreadyConnectedToPrivy && (
          <TableView
            title="CONVERSE ACCOUNT"
            items={[
              {
                id: "phone",
                leftView: <TableViewEmoji emoji="📞" />,
                title: "Connect via Phone",
                rightView,
                action: () => {
                  setConnectionMethod("phone");
                },
              },
            ]}
          />
        )}

        {hasInstalledWallets && !isDesktop && (
          <TableView
            title="INSTALLED APPS"
            items={walletsInstalled.list.map((w) => ({
              id: w.name,
              leftView: <TableViewImage imageURI={w.iconURL} />,
              rightView,
              title: `Connect ${w.name}`,
              action: async () => {
                setLoading(true);
                setConnectionMethod("wallet");
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
                  setConnectionMethod(undefined);
                  setLoading(false);
                }
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
                  setConnectionMethod("desktop");
                }
              },
            },
            {
              id: "seedphrase",
              leftView: <TableViewEmoji emoji="🔑" />,
              title: "Connect via seed phrase",
              rightView,
              action: () => {
                setConnectionMethod("seedPhrase");
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
      {addingNewAccount && (
        <Button
          title="Cancel"
          variant="text"
          style={[styles.cancelButton, { top: insets.top + 9 }]}
          onPress={() => setAddingNewAccount(false)}
        />
      )}
    </OnboardingComponent>
  );
}

const styles = StyleSheet.create({
  walletSelectorContainer: {
    width: "100%",
    flexGrow: 1,
    marginTop: isDesktop ? 80 : 30,
    justifyContent: "flex-end",
    paddingHorizontal: Platform.OS === "android" ? 0 : 24,
  },
  cancelButton: {
    position: "absolute",
    top: 0,
    left: Platform.OS === "android" ? 10 : 30,
  },
});
