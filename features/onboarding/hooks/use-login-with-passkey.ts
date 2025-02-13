import {
  AuthStatuses,
  useAuthStore,
} from "@/features/authentication/auth.store";
import { useExecuteOnceWhenReady } from "@/hooks/use-execute-once-when-ready";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";

export function useLoginWithPasskey() {
  const { client: smartWalletClient } = useSmartWallets();
  const { loginWithPasskey: privyLoginWithPasskey } =
    usePrivyLoginWithPasskey();

  const isSigningIn = useAuthStore(
    (state) => state.status === AuthStatuses.signingIn
  );

  useExecuteOnceWhenReady({
    callback: async (smartWalletClient) => {
      try {
        const signer = createSmartWalletSigner(smartWalletClient);
        await createInboxWithSigner(signer);
      } catch (error) {
        logger.error(
          `[login-with-passkey] Error handling smart wallet ready: ${error}`
        );
        captureErrorWithToast(error);
      }
    },
    deps: [smartWalletClient, isSigningIn],
  });

  const login = async () => {
    useAuthStore.getState().actions.setStatus("signingIn");
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return { login };
}
