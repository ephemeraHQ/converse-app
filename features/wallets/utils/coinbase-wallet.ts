import { configure as configureCoinbase, handleResponse } from "@coinbase/wallet-mobile-sdk"
import { useEffect } from "react"
import { Linking } from "react-native"
import { config } from "@/config"

const coinbaseCallbackUrl = new URL(`https://app.converse.xyz/coinbase`)

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
        // @ts-expect-error - Passing a URL object to handleResponse crashes the function
        handleResponse(url)
      }
    })
    return () => sub?.remove()
  }, [])
}

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
})
