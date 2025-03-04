import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey"
import { useSmartWallets } from "@privy-io/expo/smart-wallets"
import { useEffect, useRef, useState } from "react"
import { createXmtpSignerFromPrivySwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { logger } from "@/utils/logger"
import { RELYING_PARTY } from "../onboarding.constants"

export function useLoginWithPasskey() {
  const { client: smartWalletClient } = useSmartWallets()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const clientRef = useRef(smartWalletClient)
  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey()

  useEffect(() => {
    clientRef.current = smartWalletClient
  }, [smartWalletClient])

  async function waitForSmartWalletClient(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      if (clientRef.current) {
        return clientRef.current
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error("Timeout waiting for smart wallet client")
  }

  const login = async () => {
    try {
      setIsLoggingIn(true)

      // Step 1: Passkey login
      logger.debug(`[Passkey Login] Starting passkey authentication`)
      await privyLoginWithPasskey({
        relyingParty: RELYING_PARTY,
      })

      // Step 2: Wallet setup
      logger.debug(`[Wallet Setup] Getting smart wallet client`)
      const client = await waitForSmartWalletClient()
      const signer = createXmtpSignerFromPrivySwc(client)

      // Step 3: Inbox setup
      logger.debug(`[Inbox Setup] Creating inbox for address: ${client.account.address}`)
      const xmtpClient = await createXmtpClient({
        inboxSigner: signer,
      })

      return {
        inboxId: xmtpClient.inboxId,
        ethereumAddress: client.account.address,
      }
    } catch (error) {
      logger.error("[login] Error during login process:", error)
      throw error
    } finally {
      setIsLoggingIn(false)
    }
  }

  return { login, isLoggingIn }
}
