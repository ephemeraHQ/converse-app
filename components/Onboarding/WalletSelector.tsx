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
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useRouter } from "../../navigation/useNavigation";
import { isDesktop } from "../../utils/device";
import { getEthOSSigner } from "../../utils/ethos";
import TableView from "../TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../TableView/TableViewImage";

export default function WalletSelector() {
  const router = useRouter();

  const { setConnectionMethod, setSigner, setLoading, setAddingNewAccount } =
    useOnboardingStore(
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

    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          loadInstalledWallets(true);
        }
        appState.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, []);

  const hasInstalledWallets = walletsInstalled.list.length > 0;
  const insets = useSafeAreaInsets();

  return (
    <OnboardingComponent
      title={translate("walletSelector.title")}
      picto="message.circle.fill"
      subtitle={translate("walletSelector.subtitle")}
      backButtonText={translate("walletSelector.backButton")}
      backButtonAction={() => setAddingNewAccount(false)}
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
                router.push("PhoneLogin");
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
                router.push("EphemeralLogin");
              },
            },
          ]}
        />

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
                    signer ? setSigner(signer) : setLoading(false);
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
              : translate("walletSelector.connectionOptions.connectForDevs")
          }
          items={[
            {
              id: "privateKey",
              leftView: <TableViewEmoji emoji="🔑" />,
              title: translate(
                "walletSelector.connectionOptions.connectViaKey"
              ),
              rightView,
              action: () => router.push("ConnectWallet"),
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
              action: () => Linking.openURL(w.url),
            }))}
          />
        )}
      </View>
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
