import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { ConnectViaWalletStoreProvider } from "../../components/Onboarding/ConnectViaWallet/connectViaWalletStore";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";

export function OnboardingConnectWalletScreen() {
  return (
    <ConnectViaWalletStoreProvider>
      <OnboardingScreenComp>
        <ConnectViaWallet />
      </OnboardingScreenComp>
    </ConnectViaWalletStoreProvider>
  );
}
