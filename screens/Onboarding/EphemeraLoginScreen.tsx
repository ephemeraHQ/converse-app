import Button from "@components/Button/Button";
import ValueProps from "@components/Onboarding/ValueProps";
import { PictoTitleSubtitle } from "@components/PictoTitleSubtitle";
import { Screen } from "@components/Screen";
import { translate } from "@i18n";
import { utils } from "@noble/secp256k1";
import { PictoSizes } from "@styles/sizes";
import { spacing } from "@theme/spacing";
import { Wallet } from "ethers";
import { useCallback, useEffect } from "react";

import { Terms } from "../../components/Onboarding/Terms";
import { initXmtpClient } from "../../components/Onboarding/use-init-xmtp-client";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { Text } from "../../design-system/Text";
import { VStack } from "../../design-system/VStack";

export function EphemeraLoginScreen() {
  const { setLoading, setSigner, setIsEphemeral } = useOnboardingStore(
    useSelect(["setLoading", "setSigner", "setIsEphemeral"])
  );

  const generateWallet = useCallback(async () => {
    setLoading(true);
    const signer = new Wallet(utils.randomPrivateKey());
    setIsEphemeral(true);
    setSigner(signer);
    initXmtpClient({
      signer,
      address: await signer.getAddress(),
      connectionMethod: "ephemeral",
      privyAccountId: "",
      isEphemeral: true,
      pkPath: "",
    });
  }, [setIsEphemeral, setLoading, setSigner]);

  useEffect(() => {
    return () => {
      setIsEphemeral(false);
    };
  }, [setIsEphemeral]);

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]}>
      <PictoTitleSubtitle.Container
        style={
          {
            // ...debugBorder(),
            // marginBottom: spacing.xl, // Remove when we remove the padding for value props
          }
        }
      >
        <PictoTitleSubtitle.Picto
          picto="cloud"
          size={PictoSizes.onboardingComponent}
        />
        <PictoTitleSubtitle.Title>
          {translate("createEphemeral.title")}
        </PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle>
          {translate("createEphemeral.subtitle")}
        </PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>

      <ValueProps />

      <Text
        size="xxl"
        style={{
          textAlign: "center",
          marginBottom: spacing.lg,
        }}
      >
        {translate("createEphemeral.disconnect_to_remove")}
      </Text>

      <VStack style={{ rowGap: spacing.sm }}>
        <Button
          variant="primary"
          onPress={generateWallet}
          title={translate("createEphemeral.createButton")}
        />

        <Terms />
      </VStack>
    </Screen>
  );
}
