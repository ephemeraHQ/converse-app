import { memo, useEffect } from "react";

import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import {
  ConnectViaWalletStoreProvider,
  useConnectViaWalletStore,
} from "../../components/Onboarding/ConnectViaWallet/connectViaWalletStore";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { useRouter } from "../../navigation/useNavigation";

export function OnboardingConnectWalletScreen() {
  return (
    <ConnectViaWalletStoreProvider>
      <Main />
    </ConnectViaWalletStoreProvider>
  );
}

const Main = memo(function Main() {
  const store = useConnectViaWalletStore();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      if (state.onboardingDone) {
        router.navigate("OnboardingUserProfile");
      }
    });
    return () => unsubscribe();
  }, [store, router]);

  return (
    <OnboardingScreenComp>
      <ConnectViaWallet />
    </OnboardingScreenComp>
  );
});
