import { setAndroidColors } from "@styles/colors/helpers";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import config from "../../config";
import { useCurrentAccount } from "../../data/store/accountsStore";
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

  // Use this to verify if the user is signed in for now
  const isSignedIn = !!useCurrentAccount();

  const {
    setSplashScreenHidden,
    hydrationDone,
    navigationReady,
    splashScreenHidden,
  } = useAppStore(
    useSelect([
      "setSplashScreenHidden",
      "hydrationDone",
      "navigationReady",
      "splashScreenHidden",
    ])
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
    if (!hydrationDone) {
      logger.debug("Not redirecting because hydrationDone is false");
      return;
    }

    if (!splashScreenHidden) {
      logger.debug("Not redirecting because splashScreenHidden is false");
      return;
    }

    if (!navigationReady) {
      logger.debug("Not redirecting because navigationReady is false");
      return;
    }

    // For now we don't have any redirection when the user is not signed in
    if (!isSignedIn) {
      logger.debug("Not redirecting because isSignedIn is false");
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
  }, [hydrationDone, url, splashScreenHidden, navigationReady, isSignedIn]);

  return null;
}
