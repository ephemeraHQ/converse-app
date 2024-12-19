import React, { memo, useCallback } from "react";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
import { PictoSizes } from "../../styles/sizes";
import {
  PasskeyAuthStoreProvider,
  usePasskeyAuthStoreContext,
} from "@/features/onboarding/passkey/passkeyAuthStore";
import { onPasskeyCreate } from "@/utils/passkeys/createPasskey";
import { Button } from "@/design-system/Button/Button";

export const OnboardingPasskeyScreen = memo(function Screen() {
  return (
    <PasskeyAuthStoreProvider loading={false}>
      <Content />
    </PasskeyAuthStoreProvider>
  );
});

const Content = memo(function Content() {
  const loading = usePasskeyAuthStoreContext((state) => state.loading);

  const router = useRouter();

  const handleCreatePasskey = useCallback(() => {
    onPasskeyCreate();
  }, []);

  return (
    <OnboardingScreenComp preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto
          picto={"checkmark"}
          size={PictoSizes.onboardingComponent}
        />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("privyConnect.title.enterPhone")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      <Button
        text="Create Passkey"
        onPress={handleCreatePasskey}
        loading={loading}
      />
    </OnboardingScreenComp>
  );
});
