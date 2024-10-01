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

export default function InitialStateHandler() {
  const colorScheme = useColorScheme();

  const { setSplashScreenHidden, hydrationDone } = useAppStore(
    useSelect(["setSplashScreenHidden", "hydrationDone"])
  );

  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    if (splashScreenHidden.current || !hydrationDone) {
      return;
    }

    async function handleRedirection() {
      try {
        const initialURL = await Linking.getInitialURL();
        const schemedURL = initialURL
          ? getSchemedURLFromUniversalURL(initialURL)
          : "";

        if (topicToNavigateTo) {
          await navigateToTopicWithRetry();
        } else if (schemedURL) {
          await Linking.openURL(schemedURL);
        }
      } catch (error) {
        // TODO: Handle redirection error
      }
    }

    const hideSplashScreenPromise = hideSplashScreen().then(() => {
      splashScreenHidden.current = true;
      setSplashScreenHidden(true);
    });

    Promise.all([hideSplashScreenPromise, handleRedirection]).catch(() => {
      // TODO: Handle error
    });
  }, [hydrationDone, setSplashScreenHidden]);

  return null;
}
