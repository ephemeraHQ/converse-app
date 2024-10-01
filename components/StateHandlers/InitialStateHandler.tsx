import { setAndroidColors } from "@styles/colors/helpers";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import config from "../../config";
import { useAppStore } from "../../data/store/appStore";
import { useSelect } from "../../data/store/storeHelpers";
import logger from "../../utils/logger";
import {
  navigateToTopicWithRetry,
  topicToNavigateTo,
} from "../../utils/navigation";
import { sentryTrackError } from "../../utils/sentry";
import { hideSplashScreen } from "../../utils/splash/splash";

const getSchemedURLFromUniversalURL = (url: string) => {
  let schemedURL = url;
  // Handling universal links by saving a schemed URI
  config.universalLinks.forEach((prefix) => {
    if (schemedURL.startsWith(prefix)) {
      schemedURL = Linking.createURL(schemedURL.replace(prefix, ""));
    }
  });
  return schemedURL;
};

const isDevelopmentClientURL = (url: string) => {
  return url.includes("expo-development-client");
};

export default function InitialStateHandler() {
  const colorScheme = useColorScheme();

  const url = Linking.useURL();

  const { setSplashScreenHidden, hydrationDone } = useAppStore(
    useSelect(["setSplashScreenHidden", "hydrationDone"])
  );

  /**
   * TODO: place somewhere else?
   */
  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  /**
   * Splash screen
   */
  useEffect(() => {
    if (!hydrationDone) {
      return;
    }

    hideSplashScreen()
      .then(() => {
        setSplashScreenHidden(true);
      })
      .catch(sentryTrackError);
  }, [hydrationDone, setSplashScreenHidden]);

  /**
   * Redirection
   */
  useEffect(() => {
    if (!hydrationDone || !useAppStore.getState().splashScreenHidden) {
      return;
    }

    async function handleRedirection() {
      try {
        if (topicToNavigateTo) {
          return navigateToTopicWithRetry();
        }

        const schemedURL = url ? getSchemedURLFromUniversalURL(url) : "";

        if (schemedURL) {
          if (isDevelopmentClientURL(schemedURL || "")) {
            logger.debug(
              "Skipping linking redirection because it's a development client URL:",
              url
            );
            return;
          }

          logger.debug("Opening URL:", schemedURL);
          await Linking.openURL(schemedURL);
        }
      } catch (error) {
        console.error("Failed to handle redirection:", error);
      }
    }

    handleRedirection();
  }, [hydrationDone, url]);

  return null;
}
