import Conversation from "../Conversation";
import { NativeStack, navigationAnimation } from "./Navigation";
import { useIsSplitScreen } from "./navHelpers";

export type ConversationNavParams = {
  topic?: string;
  message?: string;
  focus?: boolean;
  mainConversationWithPeer?: string;
};

export const ConversationScreenConfig = {
  path: "/conversation",
  parse: {
    topic: decodeURIComponent,
  },
  stringify: {
    topic: encodeURIComponent,
  },
};

export default function ConversationNav(
  routeParams?: ConversationNavParams | undefined
) {
  // If we're in split screen mode, the topic is not passed via the usual StackNavigation
  // but via the DrawerNavigation that passes it back to this component via prop
  // so we override the route when instantiating Conversation
  const isSplitScreen = useIsSplitScreen();
  return (
    <NativeStack.Screen
      name="Conversation"
      options={{
        animation: navigationAnimation,
      }}
    >
      {({ route, navigation }) => (
        <Conversation
          navigation={navigation}
          key={
            isSplitScreen
              ? `conversation-${JSON.stringify(routeParams || {})}`
              : "conversation"
          }
          route={{
            ...route,
            params: isSplitScreen && routeParams ? routeParams : route.params,
          }}
        />
      )}
    </NativeStack.Screen>
  );
}
