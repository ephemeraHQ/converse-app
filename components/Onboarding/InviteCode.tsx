import { useCallback } from "react";
import { StyleSheet, useColorScheme, Text, TextInput } from "react-native";

import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { getInvite } from "../../utils/api";
import { usePrivyAccessToken, usePrivySigner } from "../../utils/evm/privy";
import OnboardingComponent from "./OnboardingComponent";

export default function InviteCode() {
  const styles = useStyles();
  const { resetOnboarding, setLoading, inviteCode, setInviteCode, setStep } =
    useOnboardingStore(
      useSelect([
        "resetOnboarding",
        "setLoading",
        "inviteCode",
        "setInviteCode",
        "setStep",
      ])
    );
  const privySigner = usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();

  const validateCode = useCallback(async () => {
    if (!privyAccessToken || !privySigner) return;
    setLoading(true);
    try {
      await getInvite(inviteCode);
    } catch (e) {
      alert("Invalid");
      setInviteCode("");
      setLoading(false);
      return;
    }

    setStep("profile");
    setLoading(false);
  }, [
    inviteCode,
    privyAccessToken,
    privySigner,
    setInviteCode,
    setLoading,
    setStep,
  ]);

  return (
    <OnboardingComponent
      title="Invite code"
      picto="wallet.pass"
      primaryButtonText="Validate"
      primaryButtonAction={validateCode}
      backButtonText="Back to home screen"
      backButtonAction={resetOnboarding}
      shrinkWithKeyboard
    >
      <Text>You need an invite code</Text>
      <TextInput
        value={inviteCode}
        onChangeText={setInviteCode}
        style={{ width: 300, height: 50, borderWidth: 1 }}
      />
    </OnboardingComponent>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({});
};
