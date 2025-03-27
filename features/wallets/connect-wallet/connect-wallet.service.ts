import { createWallet as createWalletThirdweb } from "thirdweb/wallets"
import { ISupportedWallet } from "@/features/wallets/supported-wallets"
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
  logger.debug(`[connectWallet] Connecting wallet: ${wallet.thirdwebId}`)

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

    logger.debug(`[connectWallet] Successfully connected wallet: ${wallet.thirdwebId}`)

    return thirdwebWallet
  } catch (error) {
    throw new GenericError({
      error,
      additionalMessage: `Failed to connect wallet: ${wallet.thirdwebId}`,
    })
  }
}

/**
 * Disconnect the active wallet
 *
 */
export async function disconnectActiveWallet() {
  const store = useConnectWalletStore.getState()
  const activeWallet = store.activeWallet

  if (!activeWallet) {
    return
  }

  logger.debug(`[disconnectActiveWallet] Disconnecting active wallet`)

  await activeWallet.disconnect()
  store.actions.setActiveWallet(undefined)
  store.actions.setWalletIdThatIsConnecting(undefined)
}

export function resetConnectWalletStore() {
  const store = useConnectWalletStore.getState()
  store.actions.reset()
}
