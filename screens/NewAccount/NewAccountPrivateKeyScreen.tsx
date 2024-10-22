import React, { memo, useState } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import { Terms } from "../../components/Onboarding/Terms";
import { Button } from "../../design-system/Button/Button";
import { VStack } from "../../design-system/VStack";
import { translate } from "../../i18n";
import { spacing } from "../../theme";
import {
  PrivateKeyInput,
  useAvoidInputEffect,
  useLoginWithPrivateKey,
} from "../Onboarding/OnboardingPrivateKeyScreen";

export const NewAccountPrivateKeyScreen = memo(function () {
  const { loading, loginWithPrivateKey } = useLoginWithPrivateKey();
  const [privateKey, setPrivateKey] = useState("");

  useAvoidInputEffect();

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
            onPress={() => {
              if (!privateKey || privateKey.trim().length === 0) return;
              loginWithPrivateKey(privateKey.trim());
            }}
          />
          <Terms />
        </VStack>
      </VStack>
    </NewAccountScreenComp>
  );
});
