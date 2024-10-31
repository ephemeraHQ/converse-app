import { NativeStackScreenProps } from "@react-navigation/native-stack";
import logger from "@utils/logger";
import { memo, useCallback } from "react";

import {
  isMissingConverseProfile,
  needToShowNotificationsPermissions,
} from "./Onboarding.utils";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { setAuthStatus } from "../../data/store/authStore";
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

    const handleDoneConnecting = useCallback(() => {
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingUserProfile");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleErrorConnecting = useCallback((arg: { error: Error }) => {
      logger.debug("[Onboarding] Error connecting wallet", arg.error);
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
