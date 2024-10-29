import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback, useRef } from "react";

import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
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
    const { address } = props.route.params;
    const router = useRouter();

    const finishedConnecting = useRef(false);

    useFocusEffect(
      useCallback(() => {
        // User already connected wallet but decided to come back here, so we need to go back to get started screen
        if (finishedConnecting.current) {
          router.goBack();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
    );

    const handleDoneConnecting = useCallback(() => {
      router.navigate("OnboardingUserProfile");
      finishedConnecting.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleErrorConnecting = useCallback((arg: { error: Error }) => {
      router.goBack();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <OnboardingScreenComp>
        {/* For now we don't need to have specific stuff for onboarding vs new account so we use this component to encapsulate the connect view wallet logic */}
        <ConnectViaWallet
          address={address}
          onDoneConnecting={handleDoneConnecting}
          onErrorConnecting={handleErrorConnecting}
        />
      </OnboardingScreenComp>
    );
  }
);
