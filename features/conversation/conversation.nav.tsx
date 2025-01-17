import { ConversationScreen } from "@/features/conversation/conversation.screen";
import { NativeStack } from "@/screens/Navigation/Navigation";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { HStack } from "@design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { useNavigation } from "@react-navigation/native";
import { Platform } from "react-native";
import { ConversationTopic } from "@xmtp/react-native-sdk";

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
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  return (
    <NativeStack.Screen
      options={{
        title: "",
        headerTitle: translate("chat"),
        // headerBackVisible: false,
      }}
      name="Conversation"
      component={ConversationScreen}
    />
  );
}
