import { setAndroidColors } from "@styles/colors/helpers";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import { useAppStore } from "../../data/store/appStore";
import { useSelect } from "../../data/store/storeHelpers";
import { getSchemedURLFromUniversalURL } from "../../utils/navigation";
import { hideSplashScreen } from "../../utils/splash/splash";
import { logger } from "@utils/logger";
import { useAuthStatus } from "@/features/authentication/useAuthStatus.hook";

const isDevelopmentClientURL = (url: string) => {
  return url.includes("expo-development-client");
};

export let initialURL = "";

export function InitialStateHandler() {
  const colorScheme = useColorScheme();

  const { setSplashScreenHidden, hydrationDone } = useAppStore(
    useSelect(["setSplashScreenHidden", "hydrationDone"])
  );

  const { isRestoring } = useAuthStatus();

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    const handleInitialDeeplink = async () => {
      logger.debug("[InitialStateHandler] Handling initial deeplink");
      let openedViaURL = (await Linking.getInitialURL()) || "";
      // Handling universal links by saving a schemed URI
      openedViaURL = getSchemedURLFromUniversalURL(openedViaURL);
      initialURL = openedViaURL;
    };
    handleInitialDeeplink();
  }, []);

  useEffect(() => {
    const hideSplashScreenIfReady = async () => {
      if (!splashScreenHidden.current && hydrationDone && !isRestoring) {
        splashScreenHidden.current = true;
        setSplashScreenHidden(true);
        await hideSplashScreen();
        if (isDevelopmentClientURL(initialURL)) {
          return;
        }

        Linking.openURL(initialURL);
        // Once opened, let's remove so we don't navigate twice
        // when logging out / relogging in
        initialURL = "";
      }
    };
    hideSplashScreenIfReady();
  }, [hydrationDone, setSplashScreenHidden, isRestoring]);

  return null;
}
