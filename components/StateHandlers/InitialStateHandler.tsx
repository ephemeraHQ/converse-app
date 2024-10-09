import { setAndroidColors } from "@styles/colors/helpers";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import config from "../../config";
import { useAppStore } from "../../data/store/appStore";
import { useSelect } from "../../data/store/storeHelpers";
import {
  navigateToTopicWithRetry,
  topicToNavigateTo,
} from "../../utils/navigation";
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

export let initialURL = "";

export default function InitialStateHandler() {
  const colorScheme = useColorScheme();

  const { setSplashScreenHidden, hydrationDone } = useAppStore(
    useSelect(["setSplashScreenHidden", "hydrationDone"])
  );

  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    const handleInitialDeeplink = async () => {
      let openedViaURL = (await Linking.getInitialURL()) || "";
      // Handling universal links by saving a schemed URI
      openedViaURL = getSchemedURLFromUniversalURL(openedViaURL);
      initialURL = openedViaURL;
    };
    handleInitialDeeplink();
  }, []);

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    const hideSplashScreenIfReady = async () => {
      if (!splashScreenHidden.current && hydrationDone) {
        splashScreenHidden.current = true;
        setSplashScreenHidden(true);
        await hideSplashScreen();

        // If app was loaded by clicking on notification,
        // let's navigate
        if (topicToNavigateTo) {
          navigateToTopicWithRetry();
        } else if (initialURL) {
          if (isDevelopmentClientURL(initialURL)) {
            return;
          }
          Linking.openURL(initialURL);
          // Once opened, let's remove so we don't navigate twice
          // when logging out / relogging in
          initialURL = "";
        }
      }
    };
    hideSplashScreenIfReady();
  }, [hydrationDone, setSplashScreenHidden]);

  return null;
}
