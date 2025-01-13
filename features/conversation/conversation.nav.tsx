import { ConversationScreen } from "@/features/conversation/conversation.screen";
import { NativeStack } from "@/screens/Navigation/Navigation";
import { translate } from "@/i18n";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export type ConversationNavParams = {
  topic?: ConversationTopic;
  text?: string;
  peer?: string;
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

export function ConversationNav() {
  return (
    <NativeStack.Screen
      name="Conversation"
      component={ConversationScreen}
      options={{
        headerTitle: translate("chat"),
      }}
    />
  );
}
