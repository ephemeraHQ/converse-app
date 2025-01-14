import { NativeStack } from "@/screens/Navigation/Navigation";
import { ConversationRequestsListScreen } from "./conversation-requests-list.screen";

export const ConversationRequestsListScreenConfig = {
  path: "/conversation-requests",
};

export function ConversationRequestsListNav() {
  return (
    <NativeStack.Screen
      name="ChatsRequests"
      component={ConversationRequestsListScreen}
    />
  );
}
