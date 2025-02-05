import { useCallback, useEffect } from "react";
import { usePasskeyAuthStoreContext } from "./passkeyAuthStore";
import { usePrivy } from "@privy-io/expo";
import { useSignupWithPasskey } from "@privy-io/expo/passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "./passkey.constants";
import * as LocalAuthentication from "expo-local-authentication";

export const useCreatePasskey = () => {
  // Privy Hooks
  const { logout, user: privyUser } = usePrivy();

  const { signupWithPasskey, state: signupState } = useSignupWithPasskey();

  // Passkey Store Hooks
  const { setLoading, setStatusString, setError } = usePasskeyAuthStoreContext(
    (state) => state
  );

  // Privy Auth Store Hooks

  useEffect(() => {
    setStatusString(signupState.status);
  }, [setStatusString, signupState.status]);

  const handleCreateAccountWithPasskey = useCallback(async () => {
    const isEnrolledInBiometrics = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolledInBiometrics) {
      alert("Please activate Face ID or Touch ID to use Passkey");
      return;
    }

    try {
      setLoading(true);
      if (privyUser) {
        // We support multiple accounts, so we need to logout of the current before creating a new one
        await logout();
      }
      const { user } = await signupWithPasskey({
        relyingParty: RELYING_PARTY,
      });
      if (!user) {
        throw new Error("No account created from Passkey");
      }
      setStatusString("Account created - Waiting for smart wallet");
    } catch (e: any) {
      setError(e?.message ?? "Error creating Passkey account");
      captureErrorWithToast(e);
    }
  }, [
    logout,
    signupWithPasskey,
    setError,
    setStatusString,
    privyUser,
    setLoading,
  ]);

  return {
    createPasskey: handleCreateAccountWithPasskey,
  };
};
