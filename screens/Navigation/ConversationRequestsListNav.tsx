import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import ConversationFlashList from "../../components/ConversationFlashList";
import { useChatStore } from "../../data/store/accountsStore";
import { pick } from "../../utils/objects";
import { NativeStack, navigationAnimation } from "./Navigation";

export default function ConversationRequestsListNav() {
  const { sortedConversationsWithPreview } = useChatStore((s) =>
    pick(s, ["sortedConversationsWithPreview"])
  );
  return (
    <NativeStack.Screen
      name="ChatsRequests"
      options={() => ({
        animation: navigationAnimation,
        headerTitle: "Requests",
      })}
    >
      {(navigationProps) => (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ConversationFlashList
            {...navigationProps}
            items={sortedConversationsWithPreview.conversationsRequests}
          />
        </GestureHandlerRootView>
      )}
    </NativeStack.Screen>
  );
}
