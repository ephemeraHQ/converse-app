import {
  PrivyUser,
  usePrivy,
  useEmbeddedEthereumWallet as usePrivyEmbeddedEthereumWallet,
} from "@privy-io/expo"
import {
  useLoginWithPasskey as usePrivyLoginWithPasskey,
  useSignupWithPasskey as usePrivySignupWithPasskey,
} from "@privy-io/expo/passkey"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { useLogout } from "@/features/authentication/use-logout"
import { RELYING_PARTY } from "@/features/onboarding/onboarding.constants"
import { createXmtpSignerFromSwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc"
import { useSmartWalletClient } from "@/features/wallets/smart-wallet"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { captureError } from "@/utils/capture-error"
import { authLogger, logger } from "@/utils/logger"

type IAuthContextType = {
  isProcessingWeb3Stuff: boolean
  user: PrivyUser | null
  login: () => Promise<void>
  signup: () => Promise<void>
  restart: () => void
}

type IAuthContextProps = {
  children: React.ReactNode
}

const AuthContext = createContext<IAuthContextType>({} as IAuthContextType)

export const AuthContextProvider = (props: IAuthContextProps) => {
  const { children } = props

  const [isProcessingWeb3Stuff, setIsProcessingWeb3Stuff] = useState(false)

  const { smartWalletClient } = useSmartWalletClient()
  const { create: createEmbeddedWallet } = usePrivyEmbeddedEthereumWallet()
  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey()
  const { signupWithPasskey: privySignupWithPasskey } = usePrivySignupWithPasskey()
  const { user } = usePrivy()

  const clientRef = useRef(smartWalletClient)

  const { logout } = useLogout()

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

  const login = useCallback(async () => {
    try {
      setIsProcessingWeb3Stuff(true)

      // Step 1: Passkey login
      logger.debug(`[Passkey Login] Starting passkey authentication`)
      const user = await privyLoginWithPasskey({
        relyingParty: RELYING_PARTY,
      })

      if (!user) {
        throw new Error("Passkey login failed")
      }

      // Step 2: Wallet setup
      logger.debug(`[Wallet Setup] Getting smart wallet client`)
      const swcClient = await waitForSmartWalletClient()
      const signer = createXmtpSignerFromSwc(swcClient)

      // Step 3: Inbox setup
      logger.debug(`[Inbox Setup] Creating inbox for address: ${swcClient.account.address}`)
      const xmtpClient = await createXmtpClient({
        inboxSigner: signer,
      })

      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress: swcClient.account.address,
        inboxId: xmtpClient.inboxId,
      })
    } catch (error) {
      logger.error("[login] Error during login process:", error)
      throw error
    } finally {
      setIsProcessingWeb3Stuff(false)
    }
  }, [privyLoginWithPasskey])

  const signup = useCallback(async () => {
    try {
      setIsProcessingWeb3Stuff(true)

      // Step 1: Passkey signup
      authLogger.debug(`[Passkey Signup] Starting passkey registration`)
      const user = await privySignupWithPasskey({ relyingParty: RELYING_PARTY })

      if (!user) {
        throw new Error("Passkey signup failed")
      }

      // Step 2: Wallet creation
      authLogger.debug(`Creating embedded wallet`)
      await createEmbeddedWallet()

      authLogger.debug(`Waiting for smart wallet to be created`)
      const swcClient = await waitForSmartWalletClient()
      authLogger.debug(`Smart wallet created`)

      // Step 3: Inbox creation
      const signer = createXmtpSignerFromSwc(swcClient)
      const xmtpClient = await createXmtpClient({
        inboxSigner: signer,
      })

      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress: swcClient.account.address,
        inboxId: xmtpClient.inboxId,
      })
    } catch (error) {
      throw error
    } finally {
      setIsProcessingWeb3Stuff(false)
    }
  }, [createEmbeddedWallet, privySignupWithPasskey])

  const restart = useCallback(() => {
    logout({ caller: "AuthContextProvider.restart" }).catch(captureError)
  }, [logout])

  const value = useMemo(
    () => ({ isProcessingWeb3Stuff, login, signup, restart, user }),
    [isProcessingWeb3Stuff, login, signup, restart, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): IAuthContextType {
  return useContext(AuthContext)
}
