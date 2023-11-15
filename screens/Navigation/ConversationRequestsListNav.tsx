import React from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AndroidBackAction from "../../components/AndroidBackAction";
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
      options={({ navigation }) => ({
        animation: navigationAnimation,
        headerTitle: "Requests",
        headerLeft:
          Platform.OS === "ios"
            ? undefined
            : () => <AndroidBackAction navigation={navigation} />,
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
