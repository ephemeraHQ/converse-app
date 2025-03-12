import {
  PrivyUser,
  usePrivy,
  useEmbeddedEthereumWallet as usePrivyEmbeddedEthereumWallet,
} from "@privy-io/expo"
import {
  useLoginWithPasskey as usePrivyLoginWithPasskey,
  useSignupWithPasskey as usePrivySignupWithPasskey,
} from "@privy-io/expo/passkey"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { RELYING_PARTY } from "@/features/auth-onboarding/auth-onboarding.constants"
import { useAuthOnboardingStore } from "@/features/auth-onboarding/stores/auth-onboarding.store"
import { hydrateAuth } from "@/features/authentication/hydrate-auth"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { useLogout } from "@/features/authentication/use-logout"
import { useSmartWalletClient } from "@/features/wallets/smart-wallet"
import { createXmtpSignerFromSwc } from "@/features/wallets/utils/create-xmtp-signer-from-swc"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError, captureErrorWithToast } from "@/utils/capture-error"
import { IEthereumAddress } from "@/utils/evm/address"
import { authLogger } from "@/utils/logger"
import { tryCatch } from "@/utils/try-catch"

type IAuthOnboardingContextType = {
  user: PrivyUser | null
  login: () => Promise<void>
  signup: () => Promise<void>
  restart: () => void
}

type IAuthOnboardingContextProps = {
  children: React.ReactNode
}

const AuthOnboardingContext = createContext<IAuthOnboardingContextType>(
  {} as IAuthOnboardingContextType,
)

export const AuthOnboardingContextProvider = (props: IAuthOnboardingContextProps) => {
  const { children } = props

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

  useEffect(() => {
    return () => {
      // Reset the store when the component unmounts
      useAuthOnboardingStore.getState().actions.reset()
    }
  }, [])

  async function waitForSmartWalletClient(
    // 200 attempts * 100ms = 20 seconds
    maxAttempts = 200,
  ) {
    for (let i = 0; i < maxAttempts; i++) {
      if (clientRef.current) {
        return clientRef.current
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error("Timeout waiting for smart wallet client")
  }

  const login = useCallback(async () => {
    try {
      useAuthOnboardingStore.getState().actions.setIsProcessingWeb3Stuff(true)

      // Step 1: Passkey login
      authLogger.debug(`[Passkey Login] Starting passkey authentication`)
      const { data: user, error: loginError } = await tryCatch(
        privyLoginWithPasskey({
          relyingParty: RELYING_PARTY,
        }),
      )

      if (loginError) {
        if (
          loginError.message.includes("AuthenticationServices.AuthorizationError error 1001") ||
          loginError.message.includes("UserCancelled")
        ) {
          return
        }

        throw loginError
      }

      if (!user) {
        throw new Error("Passkey login failed")
      }

      // Step 2: Wallet
      authLogger.debug(`Waiting for smart wallet to be created`)
      const { data: swcClient, error: swcError } = await tryCatch(waitForSmartWalletClient())

      if (swcError) {
        throw swcError
      }

      if (!swcClient) {
        throw new Error("Smart wallet creation failed")
      }

      authLogger.debug(`Smart wallet created`)

      // Step 3: XMTP Inbox client
      const signer = createXmtpSignerFromSwc(swcClient)
      const { data: xmtpClient, error: xmtpError } = await tryCatch(
        createXmtpClient({
          inboxSigner: signer,
        }),
      )

      if (xmtpError) {
        throw xmtpError
      }

      if (!xmtpClient) {
        throw new Error("XMTP client creation failed")
      }

      // Step 4: Set the current sender
      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress: swcClient.account.address as IEthereumAddress,
        inboxId: xmtpClient.inboxId as IXmtpInboxId,
      })

      await hydrateAuth()
    } catch (error) {
      useAuthOnboardingStore.getState().actions.reset()
      captureErrorWithToast(error, {
        message: "Failed to login with passkey",
      })
    } finally {
      useAuthOnboardingStore.getState().actions.setIsProcessingWeb3Stuff(false)
    }
  }, [privyLoginWithPasskey])

  const signup = useCallback(async () => {
    try {
      useAuthOnboardingStore.getState().actions.setIsProcessingWeb3Stuff(true)

      // Step 1: Passkey signup
      authLogger.debug(`[Passkey Signup] Starting passkey registration`)
      const { data: user, error: signupError } = await tryCatch(
        privySignupWithPasskey({ relyingParty: RELYING_PARTY }),
      )

      if (signupError) {
        if (
          signupError.message.includes("AuthenticationServices.AuthorizationError error 1001") ||
          signupError.message.includes("UserCancelled")
        ) {
          return
        }

        throw signupError
      }

      if (!user) {
        throw new Error("Passkey signup failed")
      }

      useAuthOnboardingStore.getState().actions.setPage("contact-card")

      // Step 2: Create embedded wallet
      authLogger.debug(`Creating embedded wallet`)
      const { error: walletError } = await tryCatch(createEmbeddedWallet())

      if (walletError) {
        throw walletError
      }

      authLogger.debug(`Waiting for smart wallet to be created`)
      const { data: swcClient, error: swcError } = await tryCatch(waitForSmartWalletClient())

      if (swcError) {
        throw swcError
      }

      if (!swcClient) {
        throw new Error("Smart wallet creation failed")
      }

      authLogger.debug(`Smart wallet created`)

      // Step 3: Create XMTP Inbox
      const signer = createXmtpSignerFromSwc(swcClient)
      const { data: xmtpClient, error: xmtpError } = await tryCatch(
        createXmtpClient({
          inboxSigner: signer,
        }),
      )

      if (xmtpError) {
        throw xmtpError
      }

      if (!xmtpClient) {
        throw new Error("XMTP client creation failed")
      }

      // Step 4: Set the current sender
      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress: swcClient.account.address as IEthereumAddress,
        inboxId: xmtpClient.inboxId as IXmtpInboxId,
      })
    } catch (error) {
      useAuthOnboardingStore.getState().actions.reset()
      captureErrorWithToast(error, {
        message: "Failed to sign up with passkey",
      })
    } finally {
      useAuthOnboardingStore.getState().actions.setIsProcessingWeb3Stuff(false)
    }
  }, [createEmbeddedWallet, privySignupWithPasskey])

  const restart = useCallback(() => {
    logout({ caller: "AuthContextProvider.restart" }).catch(captureError)
  }, [logout])

  const value = useMemo(() => ({ login, signup, restart, user }), [login, signup, restart, user])

  return <AuthOnboardingContext.Provider value={value}>{children}</AuthOnboardingContext.Provider>
}

export function useAuthOnboardingContext(): IAuthOnboardingContextType {
  const context = useContext(AuthOnboardingContext)
  if (!context) {
    throw new Error("useAuthOnboardingContext must be used within an AuthOnboardingContextProvider")
  }
  return context
}
