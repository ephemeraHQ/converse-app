import { useCallback, useEffect } from "react";
import { usePasskeyAuthStoreContext } from "./passkeyAuthStore";
import { usePrivy } from "@privy-io/expo";
import { useLoginWithPasskey as useLoginWithPasskeyPrivy } from "@privy-io/expo/passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "./passkey.constants";

/**
 * This hook is used to login with an existing Passkey account and set the account id in the Passkey Auth Store
 * It is expected to be used with usePrivySmartWalletConnection, but does not include that hook as this will likely be used with login with passkey
 * And we would run into issues with effects with how Privy is setup
 * @returns {
 *  loginWithPasskey: () => Promise<void>
 * }
 */
export const useLoginWithPasskey = () => {
  // Privy Hooks
  const { logout, user: privyUser } = usePrivy();
  const { loginWithPasskey, state: loginState } = useLoginWithPasskeyPrivy();

  // Passkey Store Hooks
  const { setLoading, setStatusString, setError } = usePasskeyAuthStoreContext(
    (state) => state
  );

  useEffect(() => {
    setStatusString(loginState.status);
  }, [setStatusString, loginState.status]);

  const handleLoginWithPasskey = useCallback(async () => {
    try {
      setLoading(true);
      if (privyUser) {
        // We support multiple accounts, so we need to logout of the current before creating a new one
        await logout();
      }
      const user = await loginWithPasskey({
        relyingParty: RELYING_PARTY,
      });
      if (!user) {
        throw new Error("No account loaded from Passkey");
      }
      setStatusString("Account loaded - Waiting for smart wallet");
    } catch (e: any) {
      setError(e?.message ?? "Error logging in with Passkey");
      captureErrorWithToast(e);
    } finally {
      setLoading(false);
    }
  }, [
    loginWithPasskey,
    logout,
    privyUser,
    setError,
    setLoading,
    setStatusString,
  ]);

  return {
    loginWithPasskey: handleLoginWithPasskey,
  };
};
