import { Terms } from "@components/Onboarding/Terms";
import { translate } from "@i18n";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { spacing } from "@theme/spacing";
import { Wallet } from "ethers";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, TextInput, useColorScheme } from "react-native";

import {
  isMissingConverseProfile,
  needToShowNotificationsPermissions,
} from "./Onboarding.utils";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { setAuthStatus } from "../../data/store/authStore";
import { VStack } from "../../design-system/VStack";
import { useRouter } from "../../navigation/useNavigation";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";

export function OnboardingPrivateKeyScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingPrivateKey">
) {
  const { loading, loginWithPrivateKey } = useLoginWithPrivateKey();
  const [privateKey, setPrivateKey] = useState("");

  const router = useRouter();

  const handlePressConnect = useCallback(async () => {
    try {
      const trimmedPrivateKey = privateKey.trim();
      if (!trimmedPrivateKey) return;
      await loginWithPrivateKey(trimmedPrivateKey);
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingUserProfile");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
    } catch (error) {
      sentryTrackError(error);
    }
  }, [loginWithPrivateKey, privateKey, router]);

  return (
    <OnboardingScreenComp preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto picto="key.horizontal" />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("privateKeyConnect.title")}
        </OnboardingPictoTitleSubtitle.Title>
        <OnboardingPictoTitleSubtitle.Subtitle>
          {translate("privateKeyConnect.subtitle")}
        </OnboardingPictoTitleSubtitle.Subtitle>
      </OnboardingPictoTitleSubtitle.Container>

      <VStack style={{ rowGap: spacing.md }}>
        <PrivateKeyInput value={privateKey} onChange={setPrivateKey} />

        <VStack
          style={{
            rowGap: spacing.xs,
          }}
        >
          <OnboardingPrimaryCtaButton
            loading={loading}
            title={translate("privateKeyConnect.connectButton")}
            onPress={handlePressConnect}
          />
          <Terms />
        </VStack>
      </VStack>
    </OnboardingScreenComp>
  );
}

const getSignerFromPrivateKey = async (privateKey: string) => {
  try {
    const signer = new Wallet(privateKey);
    return signer;
  } catch (e: any) {
    Alert.alert(translate("privateKeyConnect.invalidPrivateKey"));
  }
};

export const useLoginWithPrivateKey = () => {
  const [loading, setLoading] = useState(false);

  const loginWithPrivateKey = useCallback(async (privateKey: string) => {
    setLoading(true);
    try {
      const signer = await getSignerFromPrivateKey(privateKey);

      if (!signer) {
        throw new Error("Couldnt get signer from private key");
      }

      await initXmtpClient({
        signer,
        address: await signer.getAddress(),
      });
    } catch (error) {
      sentryTrackError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, loginWithPrivateKey };
};

type IPrivateKeyInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const PrivateKeyInput = ({ value, onChange }: IPrivateKeyInputProps) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const handleChangeText = useCallback(
    (content: string) => {
      onChange(content.replace(/\n/g, " "));
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    onChange(value.trim());
  }, [onChange, value]);

  const handleKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === "Enter") {
      e.currentTarget.blur();
    }
  }, []);

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      style={styles.textInput}
      placeholder={translate("privateKeyConnect.privateKeyPlaceholder")}
      placeholderTextColor={textSecondaryColor(colorScheme)}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      value={value}
      onKeyPress={handleKeyPress}
    />
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    textInput: {
      height: 130,
      width: "100%",
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: primaryColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      color: textPrimaryColor(colorScheme),
    },
  });
};
