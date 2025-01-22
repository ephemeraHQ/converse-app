import React, { memo } from "react";

import {
  needToShowNotificationsPermissions,
  isMissingConverseProfile,
} from "../Onboarding.utils";
import { OnboardingPictoTitleSubtitle } from "../../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "../../../components/Onboarding/OnboardingScreenComp";
import { setAuthStatus } from "../../../data/store/authStore";
import { PrivyPhoneEntry } from "../Privy/PrivyPhoneEntry";
import { PrivyPhoneVerification } from "../Privy/PrivyPhoneVerification";
import {
  PrivyAuthStoreProvider,
  usePrivyAuthStoreContext,
} from "../Privy/privyAuthStore";
import { usePrivyConnection } from "../Privy/usePrivyConnection";
import { translate } from "../../../i18n";
import { useRouter } from "../../../navigation/useNavigation";
import { PictoSizes } from "../../../styles/sizes";

export const OnboardingPrivyScreen = memo(function () {
  return (
    <PrivyAuthStoreProvider>
      <Content />
    </PrivyAuthStoreProvider>
  );
});

const Content = memo(function Content() {
  const status = usePrivyAuthStoreContext((state) => state.status);

  const router = useRouter();

  usePrivyConnection({
    onConnectionDone: () => {
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingCreateContactCard");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
    },
    onConnectionError: (error) => {
      router.goBack();
    },
  });

  return (
    <OnboardingScreenComp preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto
          picto={status === "enter-phone" ? "phone" : "checkmark"}
          size={PictoSizes.onboardingComponent}
        />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("privyConnect.title.enterPhone")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      {status === "enter-phone" ? (
        <PrivyPhoneEntry />
      ) : (
        <PrivyPhoneVerification />
      )}
    </OnboardingScreenComp>
  );
});
