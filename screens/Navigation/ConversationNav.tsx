import Conversation from "../Conversation";
import { NativeStack, navigationAnimation } from "./Navigation";

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

export default function ConversationNav(topic?: string | undefined) {
  // If we're in split screen mode, the topic is not passed via the usual StackNavigation
  // but via the DrawerNavigation that passes it back to this component via prop
  // so we override the route when instantiating Conversation
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
          route={{
            ...route,
            params: { ...route.params, topic: route.params?.topic || topic },
          }}
        />
      )}
    </NativeStack.Screen>
  );
}
