import { ConversationScreen } from "@/features/conversation/conversation.screen";
import { NativeStack } from "@/screens/Navigation/Navigation";
import { translate } from "@/i18n";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";

export type ConversationNavParams = {
  topic?: ConversationTopic;
  composerTextPrefill?: string;
  searchSelectedUserInboxIds?: InboxId[];
  isNew?: boolean;
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
