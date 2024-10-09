import { setAndroidColors } from "@styles/colors/helpers";
import logger from "@utils/logger";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import { useAppStore } from "../../data/store/appStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import {
  getSchemedURLFromUniversalURL,
  navigateToTopicWithRetry,
  topicToNavigateTo,
} from "../../utils/navigation";
import { hideSplashScreen } from "../../utils/splash/splash";

const isDevelopmentClientURL = (url: string) => {
  return url.includes("expo-development-client");
};

export let initialURL = "";

export default function InitialStateHandler() {
  const colorScheme = useColorScheme();
  const setDesktopConnectSessionId = useOnboardingStore(
    (s) => s.setDesktopConnectSessionId
  );
  const { setSplashScreenHidden, hydrationDone } = useAppStore(
    useSelect(["setSplashScreenHidden", "hydrationDone"])
  );

  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  const parseDesktopSessionURL = useCallback(
    (url?: string) => {
      if (!url) return;
      const schemedURL = getSchemedURLFromUniversalURL(url);
      try {
        const { hostname, queryParams, path } = Linking.parse(schemedURL);
        if (
          hostname?.toLowerCase() === "desktopconnect" &&
          (queryParams?.sessionId || path)
        ) {
          const sessionId = queryParams?.sessionId
            ? queryParams?.sessionId.toString()
            : `${path}`;
          setDesktopConnectSessionId(sessionId);
        }
      } catch (e) {
        logger.error(e);
      }
    },
    [setDesktopConnectSessionId]
  );

  useEffect(() => {
    const handleInitialDeeplink = async () => {
      let openedViaURL = (await Linking.getInitialURL()) || "";
      // Handling universal links by saving a schemed URI
      openedViaURL = getSchemedURLFromUniversalURL(openedViaURL);
      initialURL = openedViaURL;
      parseDesktopSessionURL(openedViaURL);
    };
    handleInitialDeeplink();
  }, [parseDesktopSessionURL]);

  useEffect(() => {
    // Parsing the desktop session id if any!
    Linking.addEventListener("url", (event) => {
      parseDesktopSessionURL(event.url);
    });
  }, [parseDesktopSessionURL]);

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
