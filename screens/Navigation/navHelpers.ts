import { StackActions, getStateFromPath } from "@react-navigation/native";
import { ColorSchemeName, Platform, useWindowDimensions } from "react-native";

import { initialURL } from "../../components/StateHandlers/InitialStateHandler";
import config from "../../config";
import {
  backgroundColor,
  headerTitleStyle,
  listItemSeparatorColor,
} from "../../utils/colors";
import { isDesktop } from "../../utils/device";

export const getConverseStateFromPath = (path: string, options: any) => {
  // dm method must link to the Conversation Screen as well
  // but prefilling the parameters
  let pathForState = path;
  if (Platform.OS === "web" && pathForState.startsWith("/")) {
    pathForState = pathForState.slice(1);
  }
  if (pathForState.startsWith("dm?peer=")) {
    const peer = pathForState.slice(8).trim().toLowerCase();
    pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
  } else if (pathForState.startsWith("dm/")) {
    const peer = pathForState.slice(3).trim().toLowerCase();
    pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
  }
  const state = getStateFromPath(pathForState, options);
  return state;
};

export const getConverseInitialURL = () => {
  return initialURL;
};

export const stackGroupScreenOptions = (colorScheme: ColorSchemeName) => ({
  headerStyle: {
    backgroundColor: backgroundColor(colorScheme),
    borderBottomColor:
      Platform.OS === "web" ? listItemSeparatorColor(colorScheme) : undefined,
  },
  headerTitleStyle: headerTitleStyle(colorScheme),
  headerShadowVisible: Platform.OS !== "android",
});

const navigationStates: { [navigationName: string]: any } = {};

export const screenListeners =
  (navigationName: string) =>
  ({ navigation }: any) => ({
    state: (e: any) => {
      const navigationState = navigationStates[navigationName];
      // Fix deeplink if already on a screen but changing params
      const oldRoutes = navigationState?.state.routes || [];
      const newRoutes = e.data?.state?.routes || [];

      if (oldRoutes.length > 0 && newRoutes.length > 0) {
        const currentRoute = oldRoutes[oldRoutes.length - 1];
        const newRoute = newRoutes[newRoutes.length - 1];
        let shouldReplace = false;
        if (
          currentRoute.key === newRoute.key &&
          currentRoute.name === newRoute.name
        ) {
          // We're talking about the same screen!
          if (
            newRoute.name === "NewConversation" &&
            newRoute.params?.peer &&
            currentRoute.params?.peer !== newRoute.params?.peer
          ) {
            shouldReplace = true;
          } else if (
            newRoute.name === "Conversation" &&
            ((newRoute.params?.mainConversationWithPeer &&
              newRoute.params?.mainConversationWithPeer !==
                currentRoute.params?.mainConversationWithPeer) ||
              (newRoute.params?.topic &&
                newRoute.params?.topic !== currentRoute.params?.topic))
          ) {
            shouldReplace = true;
          }
        }
        if (shouldReplace) {
          navigation.dispatch(
            StackActions.replace(newRoute.name, newRoute.params)
          );
        }
      }
      navigationStates[navigationName] = e.data;
    },
  });

export const useIsSplitScreen = () => {
  const dimensions = useWindowDimensions();

  return dimensions.width > config.splitScreenThreshold || isDesktop;
};
