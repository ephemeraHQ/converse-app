import {
  ScreenListeners,
  StackActions,
  createNavigationContainerRef,
  getStateFromPath,
} from "@react-navigation/native";
import {
  backgroundColor,
  headerTitleStyle,
  textPrimaryColor,
} from "@styles/colors";
import { converseEventEmitter } from "@utils/events";
import { ColorSchemeName, Platform } from "react-native";

import { initialURL } from "../components/StateHandlers/InitialStateHandler";
import config from "../config";

export const navigationRef = createNavigationContainerRef();

export const getConverseStateFromPath = (path: string, options: any) => {
  // dm method must link to the Conversation Screen as well
  // but prefilling the parameters
  let pathForState = path as string | undefined;
  if (pathForState?.startsWith("/")) {
    pathForState = pathForState.slice(1);
  }
  if (pathForState?.startsWith("dm?peer=")) {
    const params = new URLSearchParams(pathForState.slice(3));
    pathForState = handleConversationLink({
      peer: params.get("peer"),
      text: params.get("text"),
    });
  } else if (pathForState?.startsWith("dm/")) {
    const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
    const params = new URLSearchParams(url.search);
    const peer = url.pathname.slice(4).trim().toLowerCase();
    pathForState = handleConversationLink({
      peer,
      text: params.get("text"),
    });
  } else if (pathForState?.startsWith("group?groupId=")) {
    const params = new URLSearchParams(pathForState.slice(6));
    pathForState = handleConversationLink({
      groupId: params.get("groupId"),
      text: params.get("text"),
    });
  } else if (pathForState?.startsWith("group/")) {
    const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
    const params = new URLSearchParams(url.search);
    const groupId = url.pathname.slice(7).trim();
    pathForState = handleConversationLink({
      groupId,
      text: params.get("text"),
    });
  } else if (pathForState?.startsWith("groupInvite")) {
    // TODO: Remove this once enough users have updated (September 30, 2024)
    pathForState = pathForState.replace("groupInvite", "group-invite");
  } else if (pathForState?.startsWith("?text=")) {
    const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
    const params = new URLSearchParams(url.search);
    setOpenedConversationText({ text: params.get("text") });
  }

  // Prevent navigation
  if (!pathForState) return null;

  const state = getStateFromPath(pathForState, options);
  return state;
};

const handleConversationLink = ({
  groupId,
  peer,
  text,
}: {
  groupId?: string | null;
  peer?: string | null;
  text?: string | null;
}) => {
  if (!groupId && !peer) {
    setOpenedConversationText({ text });
    return;
  }
  const parameters: { [param: string]: string } = { focus: "true" };
  if (peer) {
    parameters["mainConversationWithPeer"] = peer;
  } else if (groupId) {
    parameters["topic"] = `/xmtp/mls/1/g-${groupId}/proto`;
  }
  if (text) {
    parameters["text"] = text;
  }
  const queryString = new URLSearchParams(parameters).toString();
  return `conversation?${queryString}`;
};

const setOpenedConversationText = ({ text }: { text?: string | null }) => {
  if (text) {
    // If navigating but no group or peer, we can still prefill message for current convo
    const currentRoutes = navigationRef.current?.getRootState()?.routes || [];
    if (
      currentRoutes.length > 0 &&
      currentRoutes[currentRoutes.length - 1].name === "Conversation"
    ) {
      converseEventEmitter.emit("setCurrentConversationInputValue", text);
    }
  }
};

export const getConverseInitialURL = () => {
  return initialURL;
};

export const stackGroupScreenOptions = (colorScheme: ColorSchemeName) => ({
  headerStyle: {
    backgroundColor: backgroundColor(colorScheme),
  },
  headerTitleStyle: headerTitleStyle(colorScheme),
  headerTintColor:
    Platform.OS === "ios" ? textPrimaryColor(colorScheme) : undefined,
  headerShadowVisible: Platform.OS !== "android",
});

export const screenListeners: ScreenListeners<any, any> = {
  state: (e: any) => {
    // This function handles navigation state changes and deep linking

    const oldRoutes = navigationRef.current?.getRootState()?.routes || [];
    const newRoutes = e.data?.state?.routes || [];

    // Only proceed if there are routes to compare
    if (oldRoutes.length > 0 && newRoutes.length > 0) {
      const currentRoute = oldRoutes[oldRoutes.length - 1];
      const newRoute = newRoutes[newRoutes.length - 1];

      // Check if we're on the same screen but with different parameters
      if (
        currentRoute.key === newRoute.key &&
        currentRoute.name === newRoute.name
      ) {
        let shouldReplace = false;

        // Handle "NewConversation" screen
        if (
          newRoute.name === "NewConversation" &&
          newRoute.params?.peer &&
          currentRoute.params?.peer !== newRoute.params?.peer
        ) {
          shouldReplace = true;
        }
        // Handle "Conversation" screen
        else if (newRoute.name === "Conversation") {
          const isNewPeer =
            newRoute.params?.mainConversationWithPeer &&
            newRoute.params?.mainConversationWithPeer !==
              currentRoute.params?.mainConversationWithPeer;
          const isNewTopic =
            newRoute.params?.topic &&
            newRoute.params?.topic !== currentRoute.params?.topic;

          if (isNewPeer || isNewTopic) {
            shouldReplace = true;
          } else if (newRoute.params?.message) {
            // Set input value if there's a message parameter
            converseEventEmitter.emit(
              "setCurrentConversationInputValue",
              newRoute.params.message
            );
          }
        }

        // Replace the current route if needed
        if (shouldReplace) {
          navigation.dispatch(
            StackActions.replace(newRoute.name, newRoute.params)
          );
        }
      }
    }
  },
};
