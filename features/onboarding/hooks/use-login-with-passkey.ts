import { useAuthStore } from "@/features/authentication/auth.store";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { base } from "thirdweb/chains";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";

export function useLoginWithPasskey() {
  const { getClientForChain } = useSmartWallets();

  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey({
    onSuccess: async () => {
      try {
        const smartWalletClient = await getClientForChain({
          chainId: base.id,
        });

        if (!smartWalletClient) {
          throw new Error("Smart wallet client not ready");
        }

        const signer = createSmartWalletSigner(smartWalletClient);
        await createInboxWithSigner(signer);

        useAuthStore.getState().actions.setStatus("signedIn");
      } catch (error) {
        captureErrorWithToast(error);
        useAuthStore.getState().actions.setStatus("signedOut");
      }
    },
    onError: (error) => {
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    },
  });

  const login = async () => {
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return { login };
}
