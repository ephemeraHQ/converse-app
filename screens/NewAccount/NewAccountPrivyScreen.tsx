import { sentryTrackError } from "@utils/sentry";
import React, { memo } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import { PrivyAuthStoreProvider } from "../../features/onboarding/Privy/privyAuthStore";
import { usePrivyConnection } from "../../features/onboarding/Privy/usePrivyConnection";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
import { PictoSizes } from "../../styles/sizes";
import { isMissingConverseProfile } from "../../features/onboarding/Onboarding.utils";

export const NewAccountPrivyScreen = memo(function () {
  return (
    <PrivyAuthStoreProvider>
      <Content />
    </PrivyAuthStoreProvider>
  );
});

const Content = memo(function Content() {
  const router = useRouter();

  usePrivyConnection({
    onConnectionDone: () => {
      if (isMissingConverseProfile()) {
        router.navigate("NewAccountCreateContactCard");
      } else {
        router.popTo("Chats");
      }
    },
    onConnectionError: (error) => {
      sentryTrackError(error);
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
    </NewAccountScreenComp>
  );
});
