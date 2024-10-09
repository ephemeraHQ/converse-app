import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";

export function OnboardingConnectWalletScreen() {
  return (
    <OnboardingScreenComp>
      <ConnectViaWallet />
    </OnboardingScreenComp>
  );
}
