import { memo, useEffect } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import {
  ConnectViaWalletStoreProvider,
  useConnectViaWalletStore,
} from "../../components/Onboarding/ConnectViaWallet/connectViaWalletStore";
import { useRouter } from "../../navigation/useNavigation";

export function NewAccountConnectWalletScreen() {
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
        router.navigate("NewAccountUserProfile");
      }
    });
    return () => unsubscribe();
  }, [store, router]);

  return (
    <NewAccountScreenComp>
      <ConnectViaWallet />
    </NewAccountScreenComp>
  );
});
