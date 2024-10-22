import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback } from "react";

import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import {
  ConnectViaWalletContextProvider,
  IConnectViaWalletContextType,
} from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet.context";
import { ConnectViaWalletStoreProvider } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet.store";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { useRouter } from "../../navigation/useNavigation";
import { NavigationParamList } from "../Navigation/Navigation";

export const OnboardingConnectWalletScreen = memo(
  function OnboardingConnectWalletScreen(
    props: NativeStackScreenProps<
      NavigationParamList,
      "OnboardingConnectWallet"
    >
  ) {
    const { signer } = props.route.params;

    const router = useRouter();

    const handleDoneConnecthing = useCallback(() => {
      router.navigate("OnboardingUserProfile");
    }, [router]);

    const handleErrorConnecting = useCallback(
      (
        args: Parameters<IConnectViaWalletContextType["onErrorConnecting"]>[0]
      ) => {
        const { error } = args;
        console.log("error connecting", error);
        router.goBack();
      },
      [router]
    );

    return (
      <ConnectViaWalletStoreProvider signer={signer}>
        <ConnectViaWalletContextProvider
          onDoneConnecting={handleDoneConnecthing}
          onErrorConnecting={handleErrorConnecting}
        >
          <OnboardingScreenComp>
            {/* For now we don't need to have specific stuff for onboarding vs new account so we use this component to encapsulate the connect view wallet logic */}
            <ConnectViaWallet />
          </OnboardingScreenComp>
        </ConnectViaWalletContextProvider>
      </ConnectViaWalletStoreProvider>
    );
  }
);
