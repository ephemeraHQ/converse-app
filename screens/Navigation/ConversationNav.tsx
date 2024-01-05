import Conversation from "../Conversation";
import { NativeStack, navigationAnimation } from "./Navigation";

export default function ConversationNav(topic?: string | undefined) {
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
