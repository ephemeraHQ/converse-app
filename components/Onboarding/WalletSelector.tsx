import { translate } from "@i18n";
import { textSecondaryColor } from "@styles/colors";
import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
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
import { useConnect, useSetActiveWallet } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import OnboardingComponent from "./OnboardingComponent";
import {
  InstalledWallet,
  POPULAR_WALLETS,
  getInstalledWallets,
  installedWallets,
} from "./supportedWallets";
import config from "../../config";
import { useHasOnePrivyAccount } from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { isDesktop } from "../../utils/device";
import { getEthOSSigner } from "../../utils/ethos";
import Button from "../Button/Button";
import TableView from "../TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../TableView/TableViewImage";

export default function WalletSelector() {
  const {
    setConnectionMethod,
    setSigner,
    setLoading,
    addingNewAccount,
    setAddingNewAccount,
  } = useOnboardingStore(
    useSelect([
      "setConnectionMethod",
      "setSigner",
      "setLoading",
      "addingNewAccount",
      "setAddingNewAccount",
    ])
  );
  const colorScheme = useColorScheme();
  const { connect: thirdwebConnect } = useConnect();
  const setActiveWallet = useSetActiveWallet();
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
      title={translate("walletSelector.title")}
      picto="message.circle.fill"
      subtitle={translate("walletSelector.subtitle")}
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
            title={translate("walletSelector.converseAccount.title")}
            items={[
              {
                id: "phone",
                leftView: <TableViewEmoji emoji="📞" />,
                title: translate(
                  "walletSelector.converseAccount.connectViaPhone"
                ),
                rightView,
                action: () => {
                  setConnectionMethod("phone");
                },
              },
              {
                id: "ephemeral",
                leftView: <TableViewEmoji emoji="☁️" />,
                title: translate(
                  "walletSelector.converseAccount.createEphemeral"
                ),
                rightView,
                action: () => {
                  setConnectionMethod("ephemeral");
                },
              },
            ]}
          />
        )}

        {hasInstalledWallets && !isDesktop && (
          <TableView
            title={translate("walletSelector.installedApps.title")}
            items={walletsInstalled.list.map((w) => ({
              id: w.name,
              leftView: <TableViewImage imageURI={w.iconURL} />,
              rightView,
              title: translate("walletSelector.installedApps.connectWallet", {
                walletName: w.name,
              }),
              action: async () => {
                setLoading(true);
                setConnectionMethod("wallet");
                logger.debug(
                  `[Onboarding] Clicked on wallet ${w.name} - opening external app`
                );
                try {
                  if (w.name === "Coinbase Wallet") {
                    thirdwebConnect(async () => {
                      // instantiate wallet
                      const coinbaseWallet = createWallet(
                        "com.coinbase.wallet",
                        {
                          appMetadata: config.walletConnectConfig.appMetadata,
                          mobileConfig: {
                            callbackURL: `https://${config.websiteDomain}/coinbase`,
                          },
                        }
                      );
                      await coinbaseWallet.connect({ client: thirdwebClient });
                      setActiveWallet(coinbaseWallet);
                      return coinbaseWallet;
                    });
                  } else if (w.name === "EthOS Wallet") {
                    const signer = getEthOSSigner();
                    if (signer) {
                      setSigner(signer);
                    } else {
                      setLoading(false);
                    }
                  } else if (w.thirdwebId) {
                    const walletConnectWallet = createWallet(w.thirdwebId);
                    await walletConnectWallet.connect({
                      client: thirdwebClient,
                      walletConnect: config.walletConnectConfig,
                    });
                    setActiveWallet(walletConnectWallet);
                    return walletConnectWallet;
                  }
                } catch (e: any) {
                  logger.error("Error connecting to wallet:", e);
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
              ? translate("walletSelector.connectionOptions.title")
              : hasInstalledWallets
              ? translate("walletSelector.connectionOptions.otherOptions")
              : translate(
                  "walletSelector.connectionOptions.connectExistingWallet"
                )
          }
          items={[
            // {
            //   id: "desktop",
            //   leftView: <TableViewEmoji emoji={isDesktop ? "😎" : "💻"} />,
            //   title: isDesktop
            //     ? "Connect via browser wallet"
            //     : "Connect via desktop",
            //   rightView,
            //   action: () => {
            //     if (isDesktop) {
            //       Linking.openURL(
            //         `https://${config.websiteDomain}/connect?desktop=true`
            //       );
            //     } else {
            //       setConnectionMethod("desktop");
            //     }
            //   },
            // },
            {
              id: "privateKey",
              leftView: <TableViewEmoji emoji="🔑" />,
              title: translate(
                "walletSelector.connectionOptions.connectViaKey"
              ),
              rightView,
              action: () => {
                setConnectionMethod("privateKey");
              },
            },
          ]}
        />
        {!hasInstalledWallets && !isDesktop && (
          <TableView
            title={translate("walletSelector.popularMobileApps.title")}
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
          title={translate("walletSelector.cancel")}
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
