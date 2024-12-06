import { setAndroidColors } from "@styles/colors/helpers";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import { useAppStore } from "../../data/store/appStore";
import { useSelect } from "../../data/store/storeHelpers";
import {
  getSchemedURLFromUniversalURL,
  navigateToTopic,
  setTopicToNavigateTo,
  topicToNavigateTo,
  // topicToNavigateTo,
} from "../../utils/navigation";
import { hideSplashScreen } from "../../utils/splash/splash";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import logger from "@utils/logger";

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
      logger.debug("[InitialStateHandler] Handling initial deeplink");
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

        // note(noe): If app was loaded by clicking on notification,
        // let's navigate
        // note(lustig): This effect triggers once when initially mounted and only
        // again when hydrationDone changes
        // so I don't believe it's the right place to handle navigation
        // payloads.
        logger.debug("wa wa wee whow");
        logger.debug("Topic to navigate to: ", topicToNavigateTo);
        if (topicToNavigateTo) {
          navigateToTopic(topicToNavigateTo as ConversationTopic);
          setTopicToNavigateTo(undefined);
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
