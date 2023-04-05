import * as Linking from "expo-linking";
import { useContext, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

import config from "../../config";
import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import { setAndroidColors } from "../../utils/colors";
import { navigateToConversation } from "../../utils/navigation";
import { hideSplashScreen } from "../../utils/splash/splash";

const universalLinkPrefixes = [
  `https://${config.websiteDomain}/`,
  `http://${config.websiteDomain}/`,
  config.websiteDomain,
];

let topicToNavigateTo = "";
export const setTopicToNavigateTo = (topic: string) => {
  topicToNavigateTo = topic;
};

export default function InitialStateHandler() {
  const colorScheme = useColorScheme();
  const { state, dispatch } = useContext(AppContext);

  useEffect(() => {
    setAndroidColors(colorScheme);
  }, [colorScheme]);

  const initialURL = useRef("");

  useEffect(() => {
    const handleInitialDeeplink = async () => {
      let openedViaURL = (await Linking.getInitialURL()) || "";
      // Handling universal links by saving a schemed URI
      universalLinkPrefixes.forEach((prefix) => {
        if (openedViaURL.startsWith(prefix)) {
          openedViaURL = Linking.createURL(openedViaURL.replace(prefix, ""));
        }
      });
      initialURL.current = openedViaURL;
    };
    handleInitialDeeplink();
  }, []);

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    const hideSplashScreenIfReady = async () => {
      if (!splashScreenHidden.current && state.app.hydrationDone) {
        splashScreenHidden.current = true;
        dispatch({
          type: AppDispatchTypes.AppHideSplashscreen,
          payload: {
            hide: true,
          },
        });
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
  }, [dispatch, state.app.hydrationDone, state.xmtp.conversations]);

  return null;
}
