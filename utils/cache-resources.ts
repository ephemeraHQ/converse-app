import { Asset } from "expo-asset"
import * as Font from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { useCallback, useEffect, useState } from "react"
import logger from "./logger"

// Define the assets to cache
const imagesToCache = [
  // Splash screens
  require("@assets/splash.png"),
  require("@assets/splash-dark.png"),

  // Icons
  require("@assets/icon.png"),
  require("@assets/icon-preview.png"),
  require("@assets/images/web3/base.png"),
  require("@assets/images/web3/ens.png"),
  require("@assets/images/web3/farcaster.png"),
  require("@assets/images/web3/coinbase-wallet.png"),
  require("@assets/images/web3/lens.png"),
  require("@assets/images/web3/rainbow.png"),
  require("@assets/images/web3/unstoppable-domains.png"),
  require("@assets/images/web3/metamask.png"),
]

// Define fonts to preload
const fontsToCache = {
  // Add your fonts here
  // Example:
  // "inter-regular": require("@assets/fonts/Inter-Regular.ttf"),
  // "inter-bold": require("@assets/fonts/Inter-Bold.ttf"),
}

/**
 * Caches resources needed for the app to function properly
 * @returns An object with the loading state and a function to manually trigger caching
 */
export function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false)

  const loadResourcesAsync = useCallback(async () => {
    try {
      // Keep the splash screen visible while we fetch resources
      await SplashScreen.preventAutoHideAsync()

      // Pre-load fonts
      const fontPromises =
        Object.entries(fontsToCache).length > 0 ? [Font.loadAsync(fontsToCache)] : []

      // Pre-load images
      const imagePromises = imagesToCache.map((image) => Asset.fromModule(image).downloadAsync())

      // Wait for all resources to load
      await Promise.all([...fontPromises, ...imagePromises])
    } catch (error) {
      // Log any errors but don't crash the app
      logger.error("Error loading resources", error)
    } finally {
      setLoadingComplete(true)
    }
  }, [])

  useEffect(() => {
    loadResourcesAsync()
  }, [loadResourcesAsync])

  return {
    isLoadingComplete,
    loadResourcesAsync, // Expose this function in case manual reloading is needed
  }
}
