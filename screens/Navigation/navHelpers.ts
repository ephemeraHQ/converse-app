import { StackActions, getStateFromPath } from "@react-navigation/native";
import {
  backgroundColor,
  headerTitleStyle,
  textPrimaryColor,
} from "@styles/colors";
import { converseEventEmitter } from "@utils/events";
import { ColorSchemeName, Platform } from "react-native";

import { initialURL } from "../../components/StateHandlers/InitialStateHandler";
import config from "../../config";

/**
 * Creates a custom state object from a given path for
 * navigation in a Converse app.
 *
 * This higher-order function returns a function that
 * processes various URL formats and generates appropriate
 * navigation states. It handles special cases for direct
 * messages (DM), group chats, and text-only parameters.
 *
 * @param {string} navigationName - The name of the
 *                                  navigation context
 * @returns {Function} A function that takes a path and
 *                     options to generate a state object
 *
 * @example
 * // Input:
 * getConverseStateFromPath('MainNav')('dm?peer=0x123&text=Hello')
 * // Output:
 * // State object for navigating to a DM conversation
 * // with peer '0x123' and prefilled text 'Hello'
 *
 * @example
 * // Input:
 * getConverseStateFromPath('MainNav')('group/abc123?text=Hi all')
 * // Output:
 * // State object for navigating to group 'abc123'
 * // with prefilled text 'Hi all'
 *
 * @example
 * // Input:
 * getConverseStateFromPath('MainNav')('?text=Hello world')
 * // Output:
 * // null (prevents navigation, but sets conversation text)
 *
 * @sideEffects
 * - May modify the conversation input value via event emission
 * - Logs errors if URL parsing fails
 */
export const getConverseStateFromPath =
  (navigationName: string) => (path: string, options: any) => {
    // dm method must link to the Conversation Screen as well
    // but prefilling the parameters
    let pathForState = path as string | undefined;
    if (pathForState?.startsWith("/")) {
      pathForState = pathForState.slice(1);
    }

    // Handle group invite links
    if (pathForState?.startsWith("group-invite")) {
      const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
      const params = new URLSearchParams(url.search);
      const inviteId = params.get("inviteId") || url.pathname.split("/")[1];
      if (inviteId) {
        return {
          routes: [
            {
              name: "GroupInvite",
              params: {
                groupInviteId: inviteId,
              },
            },
          ],
        };
      }
    }

    // dm method must link to the Conversation Screen as well
    // but prefilling the parameters
    if (pathForState?.startsWith("dm?peer=")) {
      const params = new URLSearchParams(pathForState.slice(3));
      pathForState = handleConversationLink({
        navigationName,
        peer: params.get("peer"),
        text: params.get("text"),
      });
    } else if (pathForState?.startsWith("dm/")) {
      const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
      const params = new URLSearchParams(url.search);
      const peer = url.pathname.slice(4).trim().toLowerCase();
      pathForState = handleConversationLink({
        navigationName,
        peer,
        text: params.get("text"),
      });
    } else if (pathForState?.startsWith("group?groupId=")) {
      const params = new URLSearchParams(pathForState.slice(6));
      pathForState = handleConversationLink({
        navigationName,
        groupId: params.get("groupId"),
        text: params.get("text"),
      });
    } else if (pathForState?.startsWith("group/")) {
      const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
      const params = new URLSearchParams(url.search);
      const groupId = url.pathname.slice(7).trim();
      pathForState = handleConversationLink({
        navigationName,
        groupId,
        text: params.get("text"),
      });
    } else if (pathForState?.startsWith("?text=")) {
      const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
      const params = new URLSearchParams(url.search);
      setOpenedConversationText({ text: params.get("text"), navigationName });
    }

    // Prevent navigation
    if (!pathForState) return null;

    const state = getStateFromPath(pathForState, options);
    return state;
  };

const handleConversationLink = ({
  navigationName,
  groupId,
  peer,
  text,
}: {
  navigationName: string;
  groupId?: string | null;
  peer?: string | null;
  text?: string | null;
}) => {
  if (!groupId && !peer) {
    setOpenedConversationText({ text, navigationName });
    return;
  }
  const parameters: { [param: string]: string } = { focus: "true" };
  if (peer) {
    parameters["peer"] = peer;
  } else if (groupId) {
    parameters["topic"] = `/xmtp/mls/1/g-${groupId}/proto`;
  }
  if (text) {
    parameters["text"] = text;
  }
  const queryString = new URLSearchParams(parameters).toString();
  return `conversation?${queryString}`;
};

const setOpenedConversationText = ({
  text,
  navigationName,
}: {
  text?: string | null;
  navigationName: string;
}) => {
  if (text) {
    // If navigating but no group or peer, we can still prefill message for current convo
    const navigationState = navigationStates[navigationName];
    const currentRoutes = navigationState?.state.routes || [];
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
          } else if (newRoute.name === "Conversation") {
            const isNewPeer =
              newRoute.params?.peer &&
              newRoute.params?.peer !== currentRoute.params?.peer;
            const isNewTopic =
              newRoute.params?.topic &&
              newRoute.params?.topic !== currentRoute.params?.topic;
            if (isNewPeer || isNewTopic) {
              shouldReplace = true;
            } else if (newRoute.params?.message) {
              // If navigating to the same route but with a message param
              // we can set the input value (for instance from a frame)
              converseEventEmitter.emit(
                "setCurrentConversationInputValue",
                newRoute.params.message
              );
            }
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
