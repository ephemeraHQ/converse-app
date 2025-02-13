import { useAuthStore } from "@/features/authentication/auth.store";
import { createUser } from "@/utils/api/users";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import type { PrivySmartWalletAccount } from "@privy-io/public-api";
import { base } from "thirdweb/chains";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { getClientForChain } = useSmartWallets();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: async () => {
        try {
          // Create embedded wallet first
          const { user: privyUser } = await createEmbeddedWallet();

          const smartWalletAccount = privyUser.linked_accounts.find(
            (account): account is PrivySmartWalletAccount =>
              account.type === "smart_wallet"
          );

          if (!smartWalletAccount) {
            throw new Error("Smart wallet account not found");
          }

          // Get smart wallet client for the chain
          const smartWalletClient = await getClientForChain({
            chainId: base.id, // Not sure
          });

          if (!smartWalletClient) {
            throw new Error("Smart wallet client not ready");
          }

          // Create signer
          const signer = createSmartWalletSigner(smartWalletClient);

          // Create inbox
          const { inboxId } = await createInboxWithSigner(signer);

          const smartContractWalletAddress = await signer.getAddress();

          // Create user in database
          await createUser({
            privyUserId: privyUser.id,
            smartContractWalletAddress,
            inboxId,
          });

          useAuthStore.getState().actions.setStatus("signedIn");
        } catch (error) {
          logger.error(
            `[signup-with-passkey] Error in onSuccess handler: ${error}`
          );
          captureErrorWithToast(error);
        }
      },
      onError: (error) => {
        logger.error(`[signup-with-passkey] Error signing up: ${error}`);
        captureErrorWithToast(error);
      },
    });

  const signup = async () => {
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return { signup };
}
