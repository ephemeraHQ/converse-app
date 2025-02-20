import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import {
  createInboxWithSigner,
  createSmartWalletSigner,
} from "@/features/onboarding/utils/passkey";
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useEffect, useRef, useState } from "react";

export function useLoginWithPasskey() {
  const { client: smartWalletClient } = useSmartWallets();
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(smartWalletClient);
  const { loginWithPasskey: privyLoginWithPasskey } =
    usePrivyLoginWithPasskey();

  useEffect(() => {
    clientRef.current = smartWalletClient;
  }, [smartWalletClient]);

  async function waitForSmartWalletClient(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      if (clientRef.current) {
        return clientRef.current;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error("Timeout waiting for smart wallet client");
  }

  const login = async () => {
    try {
      setIsLoading(true);

      await privyLoginWithPasskey({
        relyingParty: RELYING_PARTY,
      });

      const client = await waitForSmartWalletClient();

      const signer = createSmartWalletSigner(client);

      await createInboxWithSigner(signer);

      const { inboxId } = await createInboxWithSigner(signer);

      return {
        inboxId,
        ethereumAddress: client.account.address,
      };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
