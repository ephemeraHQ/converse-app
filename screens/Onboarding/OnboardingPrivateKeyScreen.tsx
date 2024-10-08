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
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput, useColorScheme } from "react-native";
import { AvoidSoftInput } from "react-native-avoid-softinput";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { VStack } from "../../design-system/VStack";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";

export function OnboardingPrivateKeyScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingPrivateKey">
) {
  useAvoidInputEffect();

  const { loading, loginWithPrivateKey } = useLoginWithPrivateKey();
  const [privateKey, setPrivateKey] = useState("");

  return (
    <OnboardingScreenComp preset="scroll">
      <OnboardingPictoTitleSubtitle.All
        title={translate("privateKeyConnect.title")}
        subtitle={translate("privateKeyConnect.subtitle")}
        picto="key.horizontal"
      />

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
            onPress={() => {
              if (!privateKey || privateKey.trim().length === 0) return;
              loginWithPrivateKey(privateKey.trim());
            }}
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

export const useAvoidInputEffect = () => {
  useEffect(() => {
    AvoidSoftInput.setHideAnimationDelay(0);
    AvoidSoftInput.setShowAnimationDelay(0);
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    AvoidSoftInput.setEnabled(true);
    return () => {
      AvoidSoftInput.setEnabled(false);
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);
};

export const useLoginWithPrivateKey = () => {
  const [loading, setLoading] = useState(false);

  const { setSigner } = useOnboardingStore(useSelect(["setSigner"]));

  const loginWithPrivateKey = useCallback(
    async (privateKey: string) => {
      setLoading(true);
      try {
        const signer = await getSignerFromPrivateKey(privateKey);
        if (!signer) {
          setLoading(false);
          return;
        }
        setSigner(signer);
        await initXmtpClient({
          signer,
          address: await signer.getAddress(),
          connectionMethod: "privateKey",
          privyAccountId: "",
          isEphemeral: false,
          pkPath: "",
        });
      } catch (error) {
        sentryTrackError(error);
      } finally {
        setLoading(false);
      }
    },
    [setSigner]
  );

  return { loading, loginWithPrivateKey };
};

type IPrivateKeyInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const PrivateKeyInput = ({ value, onChange }: IPrivateKeyInputProps) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      style={styles.textInput}
      placeholder={translate("privateKeyConnect.privateKeyPlaceholder")}
      placeholderTextColor={textSecondaryColor(colorScheme)}
      onChangeText={(content) => {
        onChange(content.replace(/\n/g, " "));
      }}
      onFocus={() => {
        onChange(value.trim());
      }}
      value={value}
      onKeyPress={(e) => {
        if (e.nativeEvent.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
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
