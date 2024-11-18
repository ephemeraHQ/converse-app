import { setAndroidColors } from "@styles/colors/helpers";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import { useAppStore } from "../../data/store/appStore";
import { useSelect } from "../../data/store/storeHelpers";
import {
  getSchemedURLFromUniversalURL,
  navigateToTopic,
  topicToNavigateTo,
} from "../../utils/navigation";
import { hideSplashScreen } from "../../utils/splash/splash";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

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
          navigateToTopic(topicToNavigateTo as ConversationTopic);
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
