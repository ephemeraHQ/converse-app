import React, { memo } from "react";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { PrivyPhoneEntry } from "../../features/onboarding/Privy/PrivyPhoneEntry";
import { PrivyPhoneVerification } from "../../features/onboarding/Privy/PrivyPhoneVerification";
import {
  PrivyAuthStoreProvider,
  usePrivyAuthStoreContext,
} from "../../features/onboarding/Privy/privyAuthStore";
import { usePrivyConnection } from "../../features/onboarding/Privy/usePrivyConnection";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
import { PictoSizes } from "../../styles/sizes";

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
      router.navigate("OnboardingUserProfile");
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
