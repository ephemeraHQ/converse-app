import { useEmbeddedEthereumWallet } from "@privy-io/expo"
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey"
import { useSmartWallets } from "@privy-io/expo/smart-wallets"
import { useEffect, useRef, useState } from "react"
import { createXmtpSignerFromPrivySwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { authLogger } from "@/utils/logger"
import { RELYING_PARTY } from "../onboarding.constants"

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet()
  const { client: smartWalletClient } = useSmartWallets()
  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey()
  const [isSigningUp, setIsSigningUp] = useState(false)
  const clientRef = useRef(smartWalletClient)

  useEffect(() => {
    clientRef.current = smartWalletClient
  }, [smartWalletClient])

  // Helper function to wait for smart wallet client initialization
  async function waitForSmartWalletClient(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      if (clientRef.current) {
        return clientRef.current
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error("Timeout waiting for smart wallet client")
  }

  const signup = async () => {
    try {
      setIsSigningUp(true)

      // Step 1: Passkey signup
      authLogger.debug(`[Passkey Signup] Starting passkey registration`)
      await privySignupWithPasskey({ relyingParty: RELYING_PARTY })

      // Step 2: Wallet creation
      authLogger.debug(`[Wallet Setup] Creating embedded`)
      await createEmbeddedWallet()

      authLogger.debug(`[Wallet Setup] Waiting for smart wallet to be created`)
      const smartWalletclient = await waitForSmartWalletClient()
      authLogger.debug(`[Wallet Setup] Smart wallet created`)

      // Step 3: Inbox creation
      const signer = createXmtpSignerFromPrivySwc(smartWalletclient)
      const xmtpClient = await createXmtpClient({
        inboxSigner: signer,
      })

      return {
        inboxId: xmtpClient.inboxId,
        ethereumAddress: smartWalletclient.account.address,
      }
    } catch (error) {
      throw error
    } finally {
      setIsSigningUp(false)
    }
  }

  return { signup, isSigningUp }
}
