import { AppNativeStack } from "@/navigation/app-navigator";
import { ConversationRequestsListScreen } from "./conversation-requests-list.screen";

export const ConversationRequestsListScreenConfig = {
  path: "/conversation-requests",
};

export function ConversationRequestsListNav() {
  return (
    <AppNativeStack.Screen
      name="ChatsRequests"
      component={ConversationRequestsListScreen}
    />
  );
}
