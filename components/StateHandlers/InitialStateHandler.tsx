import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import config from "../../config";
import { useChatStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { setAndroidColors } from "../../utils/colors";
import {
  navigateToTopicWithRetry,
  topicToNavigateTo,
} from "../../utils/navigation";
import { pick } from "../../utils/objects";
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

export let initialURL = "";

export default function InitialStateHandler() {
  const colorScheme = useColorScheme();
  const setDesktopConnectSessionId = useOnboardingStore(
    (s) => s.setDesktopConnectSessionId
  );
  const { setSplashScreenHidden, hydrationDone } = useAppStore((s) =>
    pick(s, ["setSplashScreenHidden", "hydrationDone"])
  );
  const { conversations } = useChatStore((s) => pick(s, ["conversations"]));

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
        console.log(e);
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
