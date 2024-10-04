import {
  getInstalledWallets,
  InstalledWallet,
  installedWallets,
  POPULAR_WALLETS,
} from "@components/Onboarding/supportedWallets";
import { PictoTitleSubtitle } from "@components/PictoTitleSubtitle";
import { Screen } from "@components/Screen/ScreenComp/Screen";
import TableView from "@components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "@components/TableView/TableViewImage";
import { AnimatedVStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { textSecondaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { animations } from "@theme/animations";
import { spacing } from "@theme/spacing";
import { isDesktop } from "@utils/device";
import { getEthOSSigner } from "@utils/ethos";
import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import { AppState, useColorScheme } from "react-native";
import { useConnect, useSetActiveWallet } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import config from "../../config";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useRouter } from "../../navigation/use-navigation";

const animationDelays = [525, 550, 575, 800, 825, 850] as const;

export function OnboardingGetStartedScreen() {
  const router = useRouter();

  const { walletsInstalled } = useInstalledWallets();

  const hasInstalledWallets = walletsInstalled.list.length > 0;

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        // ...debugBorder("red"),
        // paddingHorizontal: Platform.OS === "android" ? 0 : 24,
      }}
    >
      <PictoTitleSubtitle.Container
        style={{
          marginBottom: spacing.xl,
          marginTop: spacing.xl,
        }}
      >
        <AnimatedVStack
          entering={animations.fadeInUpSlow().delay(animationDelays[2])}
        >
          <PictoTitleSubtitle.Picto
            picto="message.circle.fill"
            size={PictoSizes.onboardingComponent}
          />
        </AnimatedVStack>
        <PictoTitleSubtitle.Title
          entering={animations.fadeInUpSlow().delay(animationDelays[1])}
        >
          {translate("walletSelector.title")}
        </PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle
          entering={animations.fadeInUpSlow().delay(animationDelays[0])}
        >
          {translate("walletSelector.subtitle")}
        </PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>

      <AnimatedVStack
        entering={animations.fadeInDownSlow().delay(animationDelays[3])}
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
              rightView: RightViewChevron(),
              action: () => {
                router.push("PrivyConnectOnboarding");
              },
            },
            {
              id: "ephemeral",
              leftView: <TableViewEmoji emoji="☁️" />,
              title: translate(
                "walletSelector.converseAccount.createEphemeral"
              ),
              rightView: RightViewChevron(),
              action: () => {
                router.push("EphemeralLoginOnboarding");
              },
            },
          ]}
        />
      </AnimatedVStack>

      {hasInstalledWallets && !isDesktop && (
        <AnimatedVStack
          entering={animations.fadeInDownSlow().delay(animationDelays[4])}
        >
          <InstalledWallets wallets={walletsInstalled.list} />
        </AnimatedVStack>
      )}

      <AnimatedVStack
        entering={animations.fadeInDownSlow().delay(animationDelays[5])}
      >
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
              rightView: RightViewChevron(),
              action: () => {
                router.push("PrivateKeyConnectOnboarding");
              },
            },
          ]}
        />
      </AnimatedVStack>

      {!hasInstalledWallets && !isDesktop && (
        <AnimatedVStack
          entering={animations.fadeInDownSlow().delay(animationDelays[5])}
        >
          <PopularWallets />
        </AnimatedVStack>
      )}
    </Screen>
  );
}

export function PopularWallets() {
  return (
    <TableView
      title={translate("walletSelector.popularMobileApps.title")}
      items={POPULAR_WALLETS.map((w) => ({
        id: w.name,
        title: w.name,
        leftView: <TableViewImage imageURI={w.iconURL} />,
        rightView: RightViewChevron(),
        action: () => Linking.openURL(w.url),
      }))}
    />
  );
}

export function RightViewChevron() {
  const colorScheme = useColorScheme();

  return (
    <TableViewPicto
      symbol="chevron.right"
      color={textSecondaryColor(colorScheme)}
    />
  );
}

export function InstalledWallets({ wallets }: { wallets: InstalledWallet[] }) {
  const { connect: thirdwebConnect } = useConnect();

  const setActiveWallet = useSetActiveWallet();

  const { setSigner, setLoading } = useOnboardingStore(
    useSelect([
      "setSigner",
      "setLoading",
      "addingNewAccount",
      "setAddingNewAccount",
    ])
  );

  return (
    <TableView
      title={translate("walletSelector.installedApps.title")}
      items={wallets.map((w) => ({
        id: w.name,
        leftView: <TableViewImage imageURI={w.iconURL} />,
        rightView: RightViewChevron(),
        title: translate("walletSelector.installedApps.connectWallet", {
          walletName: w.name,
        }),
        action: async () => {
          setLoading(true);
          logger.debug(
            `[Onboarding] Clicked on wallet ${w.name} - opening external app`
          );
          try {
            if (w.name === "Coinbase Wallet") {
              thirdwebConnect(async () => {
                const coinbaseWallet = createWallet("com.coinbase.wallet", {
                  appMetadata: config.walletConnectConfig.appMetadata,
                  mobileConfig: {
                    callbackURL: `https://${config.websiteDomain}/coinbase`,
                  },
                });
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
            setLoading(false);
          }
        },
      }))}
    />
  );
}

export function useInstalledWallets() {
  const [walletsInstalled, setWalletsInstalled] = useState<{
    checked: boolean;
    list: InstalledWallet[];
  }>({
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

  return { walletsInstalled };
}
