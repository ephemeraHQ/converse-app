import { useExecuteOnceWhenReady } from "@/hooks/use-execute-once-when-ready";
import { createUser } from "@/utils/api/users";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useEmbeddedEthereumWallet, usePrivy } from "@privy-io/expo";
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useCallback } from "react";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";
import { useAuthStore } from "@/features/authentication/auth.store";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const { user: privyUser } = usePrivy();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: () => {
        createEmbeddedWallet();
      },
      onError: (error) => {
        logger.error(`[signup-with-passkey] Error signing up: ${error}`);
        captureErrorWithToast(error);
      },
    });

  useExecuteOnceWhenReady({
    callback: async (smartWalletClient, privyUser) => {
      try {
        const signer = createSmartWalletSigner(smartWalletClient);
        const { inboxId } = await createInboxWithSigner(signer);
        const smartContractWalletAddress = await signer.getAddress();

        // Creating user in our database
        await createUser({
          privyUserId: privyUser.id,
          smartContractWalletAddress,
          inboxId,
        });

        useAuthStore.getState().actions.setStatus("signedIn");
      } catch (error) {
        logger.error(
          `[signup-with-passkey] Error handling smart wallet ready: ${error}`
        );
        captureErrorWithToast(error);
      }
    },
    deps: [smartWalletClient, privyUser],
  });

  const signup = useCallback(async () => {
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  }, [privySignupWithPasskey]);

  return { signup };
}
