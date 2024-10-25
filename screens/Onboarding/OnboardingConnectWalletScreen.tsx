import { NavigationParamList } from "@navigation/Navigation.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback } from "react";

import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { useRouter } from "../../navigation/useNavigation";

export const OnboardingConnectWalletScreen = memo(
  function OnboardingConnectWalletScreen(
    props: NativeStackScreenProps<
      NavigationParamList,
      "OnboardingConnectWallet"
    >
  ) {
    const { address } = props.route.params;
    const router = useRouter();

    const handleDoneConnecting = useCallback(() => {
      router.navigate("OnboardingUserProfile");
    }, [router]);

    const handleErrorConnecting = useCallback(
      (arg: { error: Error }) => {
        router.goBack();
      },
      [router]
    );

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
