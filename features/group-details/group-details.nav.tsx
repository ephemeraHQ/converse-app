import { ConversationTopic } from "@xmtp/react-native-sdk";
import { GroupDetailsScreen } from "@/features/group-details/group-details.screen";
import { translate } from "@/i18n";
import { AppNativeStack } from "@/navigation/app-navigator";

export type GroupDetailsNavParams = {
  conversationTopic: ConversationTopic;
};

export const GroupDetailsScreenConfig = {
  path: "/group-details",
  parse: {
    conversationTopic: decodeURIComponent,
  },
  stringify: {
    conversationTopic: encodeURIComponent,
  },
};

export function GroupDetailsNav() {
  return (
    <AppNativeStack.Screen
      options={{
        title: translate("group_details"),
      }}
      name="GroupDetails"
      component={GroupDetailsScreen}
    />
  );
} 