import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";

import { hydrateAuth } from "@/features/authentication/hydrate-auth";
import { logger } from "@utils/logger";
import { useAppStore } from "../../data/store/app-store";
import { useSelect } from "../../data/store/store.utils";
import { getSchemedURLFromUniversalURL } from "../../utils/navigation";
import { hideSplashScreen } from "../../utils/splash/splash";

const isDevelopmentClientURL = (url: string) => {
  return url.includes("expo-development-client");
};

export let initialURL = "";

export function InitialStateHandler() {
  const { setSplashScreenHidden, hydrationDone } = useAppStore(
    useSelect(["setSplashScreenHidden", "hydrationDone"])
  );

  const { isRestoring } = hydrateAuth();

  const splashScreenHidden = useRef(false);

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
