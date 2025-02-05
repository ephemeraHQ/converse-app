import { useCallback, useEffect } from "react";
import { usePasskeyAuthStoreContext } from "./passkeyAuthStore";
import { usePrivy } from "@privy-io/expo";
import { useLoginWithPasskey as useLoginWithPasskeyPrivy } from "@privy-io/expo/passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "./passkey.constants";

export const useLoginWithPasskey = () => {
  const { user: privyUser } = usePrivy();
  const { loginWithPasskey, state: loginToPrivyWithPasskeyState } =
    useLoginWithPasskeyPrivy();

  const { setLoading, setStatusString, setError } = usePasskeyAuthStoreContext(
    (state) => state
  );

  useEffect(() => {
    setStatusString(loginToPrivyWithPasskeyState.status);
  }, [setStatusString, loginToPrivyWithPasskeyState.status]);

  const handleLoginWithPasskey = useCallback(async () => {
    try {
      if (privyUser) {
        throw Error("Privy user already logged in");
      }
      setLoading(true);

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
  }, [loginWithPasskey, privyUser, setError, setLoading, setStatusString]);

  return {
    loginWithPasskey: handleLoginWithPasskey,
  };
};
