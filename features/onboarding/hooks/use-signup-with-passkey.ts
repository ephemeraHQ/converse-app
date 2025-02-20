import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "@/features/onboarding/utils/passkey";
import { authLogger } from "@/utils/logger";
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

  // Helper function to wait for smart wallet client initialization
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

      // Step 1: Passkey signup
      authLogger.debug(`[Passkey Signup] Starting passkey registration`);
      await privySignupWithPasskey({ relyingParty: RELYING_PARTY });

      // Step 2: Wallet creation
      authLogger.debug(`[Wallet Setup] Creating embedded and smart wallets`);
      await createEmbeddedWallet();
      const smartWalletclient = await waitForSmartWalletClient();
      const signer = createSmartWalletSigner(smartWalletclient);

      // Step 3: Inbox creation
      authLogger.debug(
        `[Inbox Setup] Creating inbox for address: ${smartWalletclient.account.address}`
      );
      const { inboxId } = await createInboxWithSigner(signer);

      return {
        inboxId,
        ethereumAddress: smartWalletclient.account.address,
      };
    } catch (error) {
      throw error;
    } finally {
      setIsSigningUp(false);
    }
  };

  return { signup, isSigningUp };
}
