import { NavigationParamList } from "@navigation/Navigation.types";
import {
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

import { initialURL } from "../../components/StateHandlers/InitialStateHandler";
import config from "../../config";

export const navigationRef =
  createNavigationContainerRef<NavigationParamList>();

let navigationState: any = null;

export const getConverseStateFromPath = (path: string, options: any) => {
  console.log("path", path);
  console.log("options", options);

  let pathForState = path.startsWith("/") ? path.slice(1) : path;

  if (pathForState.startsWith("dm?peer=")) {
    const params = new URLSearchParams(pathForState.slice(3));
    pathForState = handleConversationLink({
      peer: params.get("peer"),
      text: params.get("text"),
    });
  }
  //
  else if (pathForState.startsWith("dm/")) {
    const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
    const peer = url.pathname.slice(4).trim().toLowerCase();
    const text = url.searchParams.get("text");
    pathForState = handleConversationLink({ peer, text });
  }
  //
  else if (pathForState.startsWith("group?groupId=")) {
    const params = new URLSearchParams(pathForState.slice(6));
    pathForState = handleConversationLink({
      groupId: params.get("groupId"),
      text: params.get("text"),
    });
  }
  //
  else if (pathForState.startsWith("group/")) {
    const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
    const groupId = url.pathname.slice(7).trim();
    const text = url.searchParams.get("text");
    pathForState = handleConversationLink({ groupId, text });
  }
  //
  else if (pathForState.startsWith("groupInvite")) {
    // TODO: Remove this once enough users have updated (September 30, 2024)
    pathForState = pathForState.replace("groupInvite", "group-invite");
  }
  //
  else if (pathForState.startsWith("?text=")) {
    const params = new URLSearchParams(pathForState);
    setOpenedConversationText({ text: params.get("text") });
    return;
  }

  if (pathForState) {
    return getStateFromPath(pathForState, options);
  }
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
    return "";
  }

  const parameters: Record<string, string> = { focus: "true" };

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
  if (!text) return;

  const currentRoutes = navigationState?.state.routes || [];
  const currentRoute = currentRoutes[currentRoutes.length - 1];

  if (currentRoute?.name === "Conversation") {
    converseEventEmitter.emit("setCurrentConversationInputValue", text);
  }
};

export const getConverseInitialURL = () => initialURL;

export const stackGroupScreenOptions = (colorScheme: ColorSchemeName) => ({
  headerStyle: {
    backgroundColor: backgroundColor(colorScheme),
  },
  headerTitleStyle: headerTitleStyle(colorScheme),
  headerTintColor:
    Platform.OS === "ios" ? textPrimaryColor(colorScheme) : undefined,
  headerShadowVisible: Platform.OS !== "android",
});

export const screenListeners = {
  state: (e: any) => {
    const oldRoutes = navigationState?.state.routes || [];
    const newRoutes = e.data?.state?.routes || [];

    if (oldRoutes.length === 0 || newRoutes.length === 0) {
      navigationState = e.data;
      return;
    }

    const currentRoute = oldRoutes[oldRoutes.length - 1];
    const newRoute = newRoutes[newRoutes.length - 1];

    if (
      currentRoute.key !== newRoute.key ||
      currentRoute.name !== newRoute.name
    ) {
      navigationState = e.data;
      return;
    }

    let shouldReplace = false;

    if (
      newRoute.name === "NewConversation" &&
      newRoute.params?.peer &&
      currentRoute.params?.peer !== newRoute.params?.peer
    ) {
      shouldReplace = true;
    } else if (newRoute.name === "Conversation") {
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
        // If navigating to the same route but with a message param
        // we can set the input value (for instance from a frame)
        converseEventEmitter.emit(
          "setCurrentConversationInputValue",
          newRoute.params.message
        );
      }
    }

    if (shouldReplace && navigationRef.current) {
      navigationRef.current.dispatch(
        StackActions.replace(newRoute.name, newRoute.params)
      );
    }

    navigationState = e.data;
  },
};
