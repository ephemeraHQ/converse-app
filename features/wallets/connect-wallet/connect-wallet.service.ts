import { createWallet as createWalletThirdweb } from "thirdweb/wallets"
import { ISupportedWallet } from "@/features/wallets/supported-wallets"
import { captureError, captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import logger from "@/utils/logger"
import { thirdwebClient } from "@/utils/thirdweb"
import { useConnectWalletStore } from "./connect-wallet.store"

/**
 * Connects a wallet using ThirdWeb
 *
 * This function handles the wallet connection process and updates the store accordingly.
 * It centralizes error handling and logging for wallet connections.
 */
export async function connectWallet(wallet: ISupportedWallet) {
  const store = useConnectWalletStore.getState()

  logger.debug(`[connectWallet] Connecting wallet: ${wallet.thirdwebId}`)

  store.actions.setIsConnecting(true)
  store.actions.setError(null)
  store.actions.setThirdwebWalletIdThatIsConnecting(wallet.thirdwebId)

  try {
    // Create the wallet first - this is what thirdweb expects
    const thirdwebWallet = createWalletThirdweb(wallet.thirdwebId, {
      mobileConfig: wallet.mobileConfig,
    })

    // Connect wallet to thirdweb client
    logger.debug(`[connectWallet] Connecting wallet to thirdweb client`)

    await thirdwebWallet.connect({
      client: thirdwebClient,
    })

    // Store the active wallet in our store
    store.actions.setActiveWallet(thirdwebWallet)

    logger.debug(
      `[connectWallet] Successfully connected wallet: ${wallet.thirdwebId}`,
    )

    return thirdwebWallet
  } catch (error) {
    const enhancedError = new GenericError({
      error,
      additionalMessage: `Failed to connect wallet: ${wallet.thirdwebId}`,
    })

    store.actions.setError(enhancedError)
    captureErrorWithToast(enhancedError, {
      message: `Error connecting ${wallet.name} wallet`,
    })

    return null
  } finally {
    store.actions.setIsConnecting(false)
  }
}

/**
 * Disconnects the currently active wallet
 *
 * This function handles the wallet disconnection process and updates the store accordingly.
 */
export async function disconnectWallet() {
  const store = useConnectWalletStore.getState()
  const activeWallet = store.activeWallet

  if (!activeWallet) {
    logger.debug(`[disconnectWallet] No active wallet to disconnect`)
    return
  }

  logger.debug(`[disconnectWallet] Disconnecting active wallet`)

  try {
    await activeWallet.disconnect()
    store.actions.setActiveWallet(undefined)
    store.actions.setThirdwebWalletIdThatIsConnecting(undefined)

    // Reset ethereum address that is connecting
    if (store.ethereumAddressThatIsConnecting) {
      store.actions.setEthereumAddressThatIsConnecting("")
    }

    logger.debug(`[disconnectWallet] Successfully disconnected wallet`)
  } catch (error) {
    captureError(
      new GenericError({
        error,
        additionalMessage: "Failed to disconnect wallet",
      }),
    )
  }
}

/**
 * Disconnects any wallet that might be in the process of connecting
 *
 * This is useful for cleanup when a component unmounts or when the user cancels the connection.
 */
export async function disconnectConnectingWallet() {
  const store = useConnectWalletStore.getState()
  const walletId = store.thirdwebWalletIdThatIsConnecting

  if (!walletId) {
    return
  }

  logger.debug(
    `[disconnectConnectingWallet] Disconnecting wallet in progress: ${walletId}`,
  )

  try {
    const thirdwebWallet = createWalletThirdweb(walletId)
    await thirdwebWallet.disconnect()
  } catch (error) {
    captureError(
      new GenericError({
        error,
        additionalMessage: `Failed to disconnect wallet in progress: ${walletId}`,
      }),
    )
  } finally {
    store.actions.reset()
  }
}
