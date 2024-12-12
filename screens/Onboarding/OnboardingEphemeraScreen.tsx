import ValueProps from "@components/Onboarding/ValueProps";
import { translate } from "@i18n";
import { utils } from "@noble/secp256k1";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { spacing } from "@theme/spacing";
import { Wallet } from "ethers";
import { useCallback, useState } from "react";

import {
  isMissingConverseProfile,
  needToShowNotificationsPermissions,
} from "./Onboarding.utils";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { Terms } from "../../components/Onboarding/Terms";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { setAuthStatus } from "../../data/store/authStore";
import { Text } from "../../design-system/Text/Text";
import { VStack } from "../../design-system/VStack";
import { useRouter } from "../../navigation/useNavigation";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";
import { foo } from "@/utils/appCheck";

export function OnboardingEphemeraScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingEphemeral">
) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const generateWallet = useCallback(async () => {
    foo();
    return;
    setLoading(true);
    try {
      const signer = new Wallet(utils.randomPrivateKey());
      await initXmtpClient({
        signer,
        address: await signer.getAddress(),
        isEphemeral: true,
      });
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingUserProfile");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
    } catch (error) {
      sentryTrackError(error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, router]);

  return (
    <OnboardingScreenComp>
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto picto="cloud" />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("createEphemeral.title")}
        </OnboardingPictoTitleSubtitle.Title>
        <OnboardingPictoTitleSubtitle.Subtitle>
          {translate("createEphemeral.subtitle")}
        </OnboardingPictoTitleSubtitle.Subtitle>
      </OnboardingPictoTitleSubtitle.Container>

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
    </OnboardingScreenComp>
  );
}
