import TableView from "@components/TableView/TableView";
import { AnimatedVStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { PictoSizes } from "@styles/sizes";
import { animations } from "@theme/animations";
import { isDesktop } from "@utils/device";
import React from "react";
import { Alert } from "react-native";

import { ConnectViaWalletPopularWalletsTableView } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWalletPopularWalletsTableView";
import { useInstalledWallets } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import {
  getConnectViaWalletTableViewEphemeralItem,
  getConnectViaWalletTableViewPhoneItem,
  getConnectViaWalletTableViewPrivateKeyItem,
  InstalledWalletsTableView,
} from "../../components/Onboarding/ConnectViaWallet/ConnectViaWalletTableViewItems";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { useAccountsStore } from "../../data/store/accountsStore";
import { useAuthStore } from "../../data/store/authStore";
import { useRouter } from "../../navigation/useNavigation";

const animationDelays = [525, 550, 575, 800, 825, 850] as const;

export function OnboardingGetStartedScreen() {
  const router = useRouter();

  const walletsInstalled = useInstalledWallets();

  const hasInstalledWallets = walletsInstalled.length > 0;

  return (
    <OnboardingScreenComp safeAreaEdges={["top", "bottom"]}>
      <OnboardingPictoTitleSubtitle.Container>
        <AnimatedVStack
          entering={animations.fadeInUpSlow().delay(animationDelays[2])}
        >
          <OnboardingPictoTitleSubtitle.Picto
            picto="message.circle.fill"
            size={PictoSizes.onboardingComponent}
          />
        </AnimatedVStack>
        <OnboardingPictoTitleSubtitle.Title
          entering={animations.fadeInUpSlow().delay(animationDelays[1])}
        >
          {translate("walletSelector.title")}
        </OnboardingPictoTitleSubtitle.Title>
        <OnboardingPictoTitleSubtitle.Subtitle
          entering={animations.fadeInUpSlow().delay(animationDelays[0])}
        >
          {translate("walletSelector.subtitle")}
        </OnboardingPictoTitleSubtitle.Subtitle>
      </OnboardingPictoTitleSubtitle.Container>

      <AnimatedVStack
        entering={animations.fadeInDownSlow().delay(animationDelays[3])}
      >
        <TableView
          title={translate("walletSelector.converseAccount.title")}
          items={[
            getConnectViaWalletTableViewPhoneItem({
              action: () => {
                router.navigate("OnboardingPrivy");
              },
            }),
            getConnectViaWalletTableViewEphemeralItem({
              action: () => {
                router.navigate("OnboardingEphemeral");
              },
            }),
          ]}
        />
      </AnimatedVStack>

      {hasInstalledWallets && !isDesktop && (
        <AnimatedVStack
          entering={animations.fadeInDownSlow().delay(animationDelays[4])}
        >
          <InstalledWalletsTableView
            onAccountExists={(arg) => {
              // TODO: Add a better message
              Alert.alert("Account already connected");
              useAccountsStore.getState().setCurrentAccount(arg.address, false);
              useAuthStore.setState({
                status: "signedIn",
              });
            }}
            onAccountDoesNotExist={({ signer }) => {
              router.navigate("OnboardingConnectWallet", { signer });
            }}
          />
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
            getConnectViaWalletTableViewPrivateKeyItem({
              action: () => {
                router.navigate("OnboardingPrivateKey");
              },
            }),
          ]}
        />
      </AnimatedVStack>

      {!hasInstalledWallets && !isDesktop && (
        <AnimatedVStack
          entering={animations.fadeInDownSlow().delay(animationDelays[5])}
        >
          <ConnectViaWalletPopularWalletsTableView />
        </AnimatedVStack>
      )}
    </OnboardingScreenComp>
  );
}
