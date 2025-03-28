import { configure as configureCoinbase, handleResponse } from "@coinbase/wallet-mobile-sdk"
import { useEffect } from "react"
import { Linking } from "react-native"
import { config } from "@/config"

export const coinbaseCallbackUrl = new URL(`https://${config.app.webDomain}/coinbase`)

/**
 * Coinbase wallet works differently than the other wallets. It requires UniversalLinks to be set up.
 * This hook sets up the UniversalLinks listener.
 */
export function useCoinbaseWalletListener() {
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const incomingUrl = new URL(url)

      if (
        incomingUrl.host === coinbaseCallbackUrl.host &&
        incomingUrl.protocol === coinbaseCallbackUrl.protocol &&
        incomingUrl.hostname === coinbaseCallbackUrl.hostname
      ) {
        handleResponse(incomingUrl)
      }
    })
    return () => sub?.remove()
  }, [])
}

configureCoinbase({
  callbackURL: coinbaseCallbackUrl,
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
})
