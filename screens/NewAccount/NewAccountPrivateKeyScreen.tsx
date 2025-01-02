import React, { memo, useCallback, useState } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import { Terms } from "../../components/Onboarding/Terms";
import { Button } from "../../design-system/Button/Button";
import { VStack } from "../../design-system/VStack";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
import { sentryTrackError } from "../../utils/sentry";
import { isMissingConverseProfile } from "../Onboarding/Onboarding.utils";
import {
  PrivateKeyInput,
  useLoginWithPrivateKey,
} from "../Onboarding/OnboardingPrivateKeyScreen";
import { useAppTheme } from "@theme/useAppTheme";

export const NewAccountPrivateKeyScreen = memo(function () {
  const { theme } = useAppTheme();

  const { loading, loginWithPrivateKey } = useLoginWithPrivateKey();
  const [privateKey, setPrivateKey] = useState("");

  const router = useRouter();

  const onConnect = useCallback(async () => {
    try {
      const trimmedPrivateKey = privateKey.trim();
      if (!trimmedPrivateKey) return;
      await loginWithPrivateKey(trimmedPrivateKey);
      if (isMissingConverseProfile()) {
        router.navigate("NewAccountUserProfile");
      } else {
        router.navigate("Chats");
      }
    } catch (error) {
      sentryTrackError(error);
    }
  }, [loginWithPrivateKey, privateKey, router]);

  return (
    <NewAccountScreenComp preset="scroll">
      <NewAccountPictoTitleSubtitle.Container>
        <NewAccountPictoTitleSubtitle.Picto picto="key.horizontal" />
        <NewAccountPictoTitleSubtitle.Title>
          {translate("privateKeyConnect.title")}
        </NewAccountPictoTitleSubtitle.Title>
        <NewAccountPictoTitleSubtitle.Subtitle>
          {translate("privateKeyConnect.subtitle")}
        </NewAccountPictoTitleSubtitle.Subtitle>
      </NewAccountPictoTitleSubtitle.Container>

      <VStack style={{ rowGap: theme.spacing.md }}>
        <PrivateKeyInput value={privateKey} onChange={setPrivateKey} />
        <VStack
          style={{
            rowGap: theme.spacing.xs,
          }}
        >
          <Button
            variant="fill"
            loading={loading}
            text={translate("privateKeyConnect.connectButton")}
            onPress={onConnect}
          />
          <Terms />
        </VStack>
      </VStack>
    </NewAccountScreenComp>
  );
});
