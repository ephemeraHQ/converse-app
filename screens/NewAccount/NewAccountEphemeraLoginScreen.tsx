import ValueProps from "@components/Onboarding/ValueProps";
import { Screen } from "@components/Screen/ScreenComp/Screen";
import { translate } from "@i18n";
import { utils } from "@noble/secp256k1";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { spacing } from "@theme/spacing";
import { Wallet } from "ethers";
import { useCallback, useState } from "react";

import { NewAccountTitleSubtitlePicto } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { Terms } from "../../components/Onboarding/Terms";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { Text } from "../../design-system/Text/Text";
import { VStack } from "../../design-system/VStack";
import { useRouter } from "../../navigation/use-navigation";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";

export function NewAccountEphemeraLoginScreen(
  props: NativeStackScreenProps<NavigationParamList, "NewAccountEphemeralLogin">
) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const generateWallet = useCallback(async () => {
    setLoading(true);
    try {
      const signer = new Wallet(utils.randomPrivateKey());
      await initXmtpClient({
        signer,
        address: await signer.getAddress(),
        connectionMethod: "ephemeral",
        privyAccountId: "",
        isEphemeral: true,
        pkPath: "",
      });
      router.push("NewAccountUserProfile");
    } catch (error) {
      sentryTrackError(error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, router]);

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
      }}
    >
      <NewAccountTitleSubtitlePicto
        picto="cloud"
        title={translate("createEphemeral.title")}
        subtitle={translate("createEphemeral.subtitle")}
      />

      <ValueProps />

      <VStack
        style={{
          marginVertical: spacing.lg,
        }}
      >
        <Text
          size="xxs"
          style={{
            textAlign: "center",
          }}
        >
          {translate("createEphemeral.disconnect_to_remove")}
        </Text>
      </VStack>

      <VStack style={{ rowGap: spacing.xs }}>
        <OnboardingPrimaryCtaButton
          loading={loading}
          onPress={generateWallet}
          title={translate("createEphemeral.createButton")}
        />
        <Terms />
      </VStack>
    </Screen>
  );
}
