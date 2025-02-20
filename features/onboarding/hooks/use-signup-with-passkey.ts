import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "@/features/onboarding/utils/passkey";
import { useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useEffect, useRef, useState } from "react";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey();
  const [isSigningUp, setIsSigningUp] = useState(false);

  const clientRef = useRef(smartWalletClient);

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

  const signup = async () => {
    try {
      setIsSigningUp(true);

      await privySignupWithPasskey({
        relyingParty: RELYING_PARTY,
      });

      await createEmbeddedWallet();

      const smartWalletclient = await waitForSmartWalletClient();

      const signer = createSmartWalletSigner(smartWalletclient);

      const { inboxId } = await createInboxWithSigner(signer);

      return {
        inboxId,
        ethereumAddress: smartWalletclient.account.address,
      };
    } catch (error) {
      throw error;
    }
    // Don't set because the component will get unmounted anyway and we don't want the loading to stop
    // finally {
    //   setIsSigningUp(false);
    // }
  };

  return { signup, isSigningUp: isSigningUp };
}
