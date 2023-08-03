import * as Linking from "expo-linking";
import { useCallback, useContext, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import config from "../../config";
import { AppContext } from "../../data/deprecatedStore/context";
import { useAppStore } from "../../data/store/appStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { setAndroidColors } from "../../utils/colors";
import { navigateToConversation } from "../../utils/navigation";
import { pick } from "../../utils/objects";
import { hideSplashScreen } from "../../utils/splash/splash";

let topicToNavigateTo = "";
export const setTopicToNavigateTo = (topic: string) => {
  topicToNavigateTo = topic;
};

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
  const { state, dispatch } = useContext(AppContext);
  const setDesktopConnectSessionId = useOnboardingStore(
    (s) => s.setDesktopConnectSessionId
  );
  const { setSplashScreenHidden, hydrationDone } = useAppStore((s) =>
    pick(s, ["setSplashScreenHidden", "hydrationDone"])
  );

  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  const initialURL = useRef("");

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
      initialURL.current = openedViaURL;
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
          if (state.xmtp.conversations[topicToNavigateTo]) {
            navigateToConversation(
              dispatch,
              state.xmtp.conversations[topicToNavigateTo]
            );
          }
          setTopicToNavigateTo("");
        } else if (initialURL.current) {
          Linking.openURL(initialURL.current);
        }
      }
    };
    hideSplashScreenIfReady();
  }, [
    dispatch,
    hydrationDone,
    setSplashScreenHidden,
    state.xmtp.conversations,
  ]);

  return null;
}
