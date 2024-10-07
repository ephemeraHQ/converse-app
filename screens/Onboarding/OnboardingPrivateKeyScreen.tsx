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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { AvoidSoftInput } from "react-native-avoid-softinput";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { VStack } from "../../design-system/VStack";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";

const getSignerFromPrivateKey = async (privateKey: string) => {
  try {
    const signer = new Wallet(privateKey);
    return signer;
  } catch (e: any) {
    Alert.alert(translate("privateKeyConnect.invalidPrivateKey"));
  }
};

export function OnboardingPrivateKeyScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingPrivateKey">
) {
  const colorScheme = useColorScheme();
  const textInputRef = useRef<TextInput | null>(null);

  const styles = useStyles();

  const { setSigner } = useOnboardingStore(useSelect(["setSigner"]));

  const [loading, setLoading] = useState(false);
  const [privateKey, setPrivateKey] = useState("");

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
    [setLoading, setSigner]
  );

  const avoidInputEffect = useCallback(() => {
    AvoidSoftInput.setHideAnimationDelay(0);
    AvoidSoftInput.setShowAnimationDelay(0);

    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    AvoidSoftInput.setEnabled(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setEnabled(false);
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);

  useEffect(avoidInputEffect);

  return (
    <OnboardingScreen preset="scroll">
      <OnboardingPictoTitleSubtitle.All
        title={translate("privateKeyConnect.title")}
        subtitle={translate("privateKeyConnect.subtitle")}
        picto="key.horizontal"
      />

      <View style={styles.entryContainer}>
        <TextInput
          multiline
          textAlignVertical="top"
          style={styles.textInput}
          placeholder={translate("privateKeyConnect.privateKeyPlaceholder")}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          onChangeText={(content) => {
            setPrivateKey(content.replace(/\n/g, " "));
          }}
          onFocus={() => {
            setPrivateKey(privateKey.trim());
          }}
          value={privateKey}
          ref={(r) => {
            textInputRef.current = r;
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === "Enter") {
              textInputRef.current?.blur();
            }
          }}
        />
      </View>

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
    </OnboardingScreen>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    entryContainer: {
      width: "100%",
      height: 130,
      marginBottom: spacing.xl,
    },
    textInput: {
      width: "100%",
      height: "100%",
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: primaryColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      color: textPrimaryColor(colorScheme),
    },
  });
};
