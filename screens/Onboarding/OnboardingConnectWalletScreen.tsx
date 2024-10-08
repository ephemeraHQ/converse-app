import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";

export function ConnectWalletScreen() {
  return (
    <OnboardingScreenComp>
      <ConnectViaWallet />
    </OnboardingScreenComp>
  );
}
