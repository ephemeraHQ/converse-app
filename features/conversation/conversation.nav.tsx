import { ConversationScreen } from "@/features/conversation/conversation.screen";
import { NativeStack } from "@/screens/Navigation/Navigation";
import { translate } from "@/i18n";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export type ConversationNavParams = {
  topic?: ConversationTopic;
  text?: string;
  peer?: string;
  optimistic?: boolean;
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
      options={{
        title: "",
        headerTitle: translate("chat"),
      }}
      name="Conversation"
      component={ConversationScreen}
    />
  );
}
