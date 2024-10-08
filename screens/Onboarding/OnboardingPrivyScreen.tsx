import { PictoSizes } from "@styles/sizes";
import React from "react";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { PrivyPhoneEntry } from "../../features/onboarding/Privy/PrivyPhoneEntry";
import { PrivyPhoneVerification } from "../../features/onboarding/Privy/PrivyPhoneVerification";
import { usePrivyConnectStore } from "../../features/onboarding/Privy/privyAuthStore";
import { usePrivyConnection } from "../../features/onboarding/Privy/usePrivyConnection";
import { translate } from "../../i18n";

export function OnboardingPrivyScreen() {
  const status = usePrivyConnectStore((state) => state.status);

  usePrivyConnection();

  return (
    <OnboardingScreen preset="scroll">
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
    </OnboardingScreen>
  );
}
