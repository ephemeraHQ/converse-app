import React, { memo } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
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

export const NewAccountPrivyScreen = memo(function () {
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
      router.navigate("NewAccountUserProfile");
    },
    onConnectionError: (error) => {
      router.goBack();
    },
  });

  return (
    <NewAccountScreenComp>
      <NewAccountPictoTitleSubtitle.Container>
        <NewAccountPictoTitleSubtitle.Picto
          picto={status === "enter-phone" ? "phone" : "checkmark"}
          size={PictoSizes.onboardingComponent}
        />
        <NewAccountPictoTitleSubtitle.Title>
          {translate("privyConnect.title.enterPhone")}
        </NewAccountPictoTitleSubtitle.Title>
      </NewAccountPictoTitleSubtitle.Container>
      {status === "enter-phone" ? (
        <PrivyPhoneEntry />
      ) : (
        <PrivyPhoneVerification />
      )}
    </NewAccountScreenComp>
  );
});
