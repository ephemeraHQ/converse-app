import React, { memo, useCallback, useState } from "react";
import { Platform } from "react-native";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import { Terms } from "../../components/Onboarding/Terms";
import { Button } from "../../design-system/Button/Button";
import { VStack } from "../../design-system/VStack";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
import { spacing } from "../../theme";
import { sentryTrackError } from "../../utils/sentry";
import {
  PrivateKeyInput,
  useAvoidInputEffect,
  useLoginWithPrivateKey,
} from "../Onboarding/OnboardingPrivateKeyScreen";

export const NewAccountPrivateKeyScreen = memo(function () {
  const { loading, loginWithPrivateKey } = useLoginWithPrivateKey();
  const [privateKey, setPrivateKey] = useState("");

  const router = useRouter();

  useAvoidInputEffect();

  const onConnect = useCallback(async () => {
    try {
      const trimmedPrivateKey = privateKey.trim();
      if (!trimmedPrivateKey) return;
      await loginWithPrivateKey(trimmedPrivateKey);
      router.navigate("NewAccountUserProfile");
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
          {translate("privateKeyConnect.subtitle", {
            storage: translate(
              `privateKeyConnect.storage.${
                Platform.OS === "ios" ? "ios" : "android"
              }`
            ),
          })}
        </NewAccountPictoTitleSubtitle.Subtitle>
      </NewAccountPictoTitleSubtitle.Container>

      <VStack style={{ rowGap: spacing.md }}>
        <PrivateKeyInput value={privateKey} onChange={setPrivateKey} />
        <VStack
          style={{
            rowGap: spacing.xs,
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
