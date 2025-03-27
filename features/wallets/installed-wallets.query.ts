import { queryOptions, useQuery } from "@tanstack/react-query"
import * as Linking from "expo-linking"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import logger from "@/utils/logger"
import { ISupportedWallet, supportedWallets } from "./supported-wallets"

export const useInstalledWalletsQuery = () => {
  return useQuery(getInstalledWalletsQueryOptions())
}

function getInstalledWalletsQueryOptions() {
  return queryOptions({
    queryKey: ["installedWallets"],
    queryFn: async () => {
      return getInstalledWallets({ supportedWallets })
    },
    staleTime: 0,
  })
}

async function getInstalledWallets(args: { supportedWallets: ISupportedWallet[] }) {
  const { supportedWallets } = args

  logger.debug(`[getInstalledWallets] Checking ${supportedWallets.length} supported wallets`)

  let installedWalletChecks: boolean[] = []

  try {
    installedWalletChecks = await Promise.all(
      supportedWallets.map(async (wallet) => {
        try {
          logger.debug(
            `[getInstalledWallets] Checking if ${wallet.name} is installed at ${wallet.customScheme}wc`,
          )

          const canOpen = await Linking.canOpenURL(`${wallet.customScheme}wc`)

          logger.debug(`[getInstalledWallets] ${wallet.name} is installed: ${canOpen}`)

          return canOpen
        } catch (error) {
          captureError(
            new GenericError({
              error,
              additionalMessage: `Error checking if ${wallet.name} is installed`,
            }),
          )
          return false
        }
      }),
    )
  } catch (error) {
    captureError(
      new GenericError({
        error,
        additionalMessage: "Error checking installed wallets",
      }),
    )
    installedWalletChecks = []
  }

  const installedWallets = supportedWallets.filter((_, index) => installedWalletChecks[index])

  logger.debug(
    `[getInstalledWallets] Found ${installedWallets.length} installed wallets: ${installedWallets.map((w) => w.name).join(", ")}`,
  )

  return installedWallets
}
